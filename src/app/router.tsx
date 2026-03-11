import { createBrowserRouter } from 'react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/common/loading-spinner'

// Lazy-loaded route components
const PublicLayout = lazy(() => import('./routes/_public'))
const AuthLayout = lazy(() => import('./routes/_auth'))
const LandingPage = lazy(() => import('./routes/index'))
const LoginPage = lazy(() => import('./routes/login'))
const SignupPage = lazy(() => import('./routes/signup'))
const CallbackPage = lazy(() => import('./routes/callback'))
const DashboardPage = lazy(() => import('./routes/dashboard'))
const ProfilePage = lazy(() => import('./routes/profile'))
const SettingsPage = lazy(() => import('./routes/settings'))
const ItemsPage = lazy(() => import('./routes/items'))
const TermsPage = lazy(() => import('./routes/terms'))
const PrivacyPage = lazy(() => import('./routes/privacy'))
const NotFoundPage = lazy(() => import('./routes/not-found'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  // Public routes (marketing pages, auth)
  {
    element: (
      <SuspenseWrapper>
        <PublicLayout />
      </SuspenseWrapper>
    ),
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
    ],
  },
  // Auth callback (no layout)
  {
    path: 'callback',
    element: (
      <SuspenseWrapper>
        <CallbackPage />
      </SuspenseWrapper>
    ),
  },
  // Protected routes (authenticated app)
  {
    path: 'app',
    element: (
      <SuspenseWrapper>
        <AuthLayout />
      </SuspenseWrapper>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'items', element: <ItemsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  // 404 catch-all
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
])
