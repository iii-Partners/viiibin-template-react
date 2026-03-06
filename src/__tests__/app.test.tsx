import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  it('shows auth not configured when no Auth0 env vars', async () => {
    const LoginPage = (await import('@/app/routes/login')).default
    render(<LoginPage />, { wrapper: createWrapper() })
    expect(screen.getByText(/Auth Not Configured/i)).toBeInTheDocument()
  })
})

describe('Dashboard', () => {
  it('renders dashboard heading', async () => {
    const DashboardPage = (await import('@/app/routes/dashboard')).default
    render(<DashboardPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument()
  })
})

describe('Settings', () => {
  it('renders settings heading', async () => {
    const SettingsPage = (await import('@/app/routes/settings')).default
    render(<SettingsPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument()
  })
})

describe('Profile', () => {
  it('renders profile heading', async () => {
    const ProfilePage = (await import('@/app/routes/profile')).default
    render(<ProfilePage />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: /Profile/i })).toBeInTheDocument()
  })
})

describe('Not Found', () => {
  it('renders 404 page', async () => {
    const NotFoundPage = (await import('@/app/routes/not-found')).default
    render(<NotFoundPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: /404|not found/i })).toBeInTheDocument()
  })
})
