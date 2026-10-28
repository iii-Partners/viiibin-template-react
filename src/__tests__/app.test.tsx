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

describe('Dashboard', () => {
  it('renders dashboard heading', async () => {
    const DashboardPage = (await import('@/app/routes/dashboard')).default
    render(<DashboardPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument()
  })

  it('holds value before any data: Start here and the getting-started steps', async () => {
    // the fresh app: the dashboard's state switch on Empty
    const { usePreferencesStore } = await import('@/stores/preferences')
    const { usePreview } = await import('@/stores/preview')
    usePreferencesStore.getState().setStateSwitches(true)
    usePreview.getState().set('dashboard', 'empty')
    const DashboardPage = (await import('@/app/routes/dashboard')).default
    render(<DashboardPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Start here')).toBeInTheDocument()
    expect(screen.getAllByText(/Add your first item/i).length).toBeGreaterThan(0)
  })

  it('opens on the Happy path while the state switches are on, and the switch moves it to Error', async () => {
    const { usePreferencesStore } = await import('@/stores/preferences')
    const { usePreview } = await import('@/stores/preview')
    const { fireEvent } = await import('@testing-library/react')
    usePreferencesStore.getState().setStateSwitches(true)
    usePreview.setState({ parts: {} })
    const DashboardPage = (await import('@/app/routes/dashboard')).default
    render(<DashboardPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('radio', { name: 'Happy', checked: true })).toBeInTheDocument()
    expect(screen.getByText(/6 items:/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Error' }))
    expect(screen.getByText('Items did not load')).toBeInTheDocument()
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
