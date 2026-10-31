import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Auth0 — always return unauthenticated for tests
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn(),
  }),
  Auth0Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock import.meta.env
vi.stubEnv('VITE_APP_NAME', 'Test App')
vi.stubEnv('VITE_AUTH0_DOMAIN', '')
vi.stubEnv('VITE_AUTH0_CLIENT_ID', '')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('Landing Page', () => {
  it('renders the app name', async () => {
    const LandingPage = (await import('@/app/routes/index')).default
    render(<LandingPage />, { wrapper: createWrapper() })
    expect(screen.getByText(/Test App/i)).toBeInTheDocument()
  })
})

describe('Login Page', () => {
  it('shows the demo-mode / auth-not-configured state when no Auth0 env vars', async () => {
    const LoginPage = (await import('@/app/routes/login')).default
    render(<LoginPage />, { wrapper: createWrapper() })
    expect(screen.getByText(/Authentication is not configured/i)).toBeInTheDocument()
  })
})

describe('Today', () => {
  it('renders its heading and what needs operations', async () => {
    const { useOs } = await import('@/os/store')
    useOs.getState().reset()
    const TodayPage = (await import('@/app/routes/today')).default
    render(<TodayPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Needs you ·/)).toBeInTheDocument()
    expect(screen.getByText(/Isabel Cruz owes iv consent/i)).toBeInTheDocument()
  })
})

// Child views have no routes: they open as screens (layered dialogs) over the main view
describe('Screens', () => {
  async function openAndRender(id: 'settings' | 'profile') {
    const { useScreens, openScreen } = await import('@/stores/screens')
    const { ScreenHost } = await import('@/app/screens')
    useScreens.getState().closeAll()
    openScreen(id)
    render(<ScreenHost />, { wrapper: createWrapper() })
  }

  it('opens settings as a dialog with its heading and a Close cue', async () => {
    await openAndRender('settings')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Settings/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument()
  })

  it('opens the profile as a dialog with its heading', async () => {
    await openAndRender('profile')
    expect(screen.getByRole('heading', { name: /Profile/i, level: 1 })).toBeInTheDocument()
  })

  it('layers a second screen over the first, and Esc closes only the top one', async () => {
    const { useScreens, openScreen } = await import('@/stores/screens')
    const { fireEvent, act, waitFor } = await import('@testing-library/react')
    await openAndRender('settings')
    act(() => openScreen('profile'))
    expect(screen.getAllByRole('dialog')).toHaveLength(2)
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })
    // the top screen fades and shrinks back before it leaves the stack
    await waitFor(() => expect(useScreens.getState().stack.map((s) => s.id)).toEqual(['settings']))
  })
})

describe('Not Found', () => {
  it('renders 404 page', async () => {
    const NotFoundPage = (await import('@/app/routes/not-found')).default
    render(<NotFoundPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: /404|not found/i })).toBeInTheDocument()
  })
})
