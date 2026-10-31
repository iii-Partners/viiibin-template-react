import { createBrowserRouter, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/common/loading-spinner'
// the authenticated shell and its main views load with the app, so switching views shows at once
import AuthLayout from './routes/_auth'
import TodayPage from './routes/today'
import GuestsPage from './routes/guests'
import RetreatsPage from './routes/retreats'
import ReviewsPage from './routes/reviews'
import CarePage from './routes/care'
import PortalPage from './routes/portal'
import BlueprintPage from './routes/blueprint'
import { RailView } from './routes/rail-view'


// Lazy-loaded public routes
const PublicLayout = lazy(() => import('./routes/_public'))
const LandingPage = lazy(() => import('./routes/index'))
const LoginPage = lazy(() => import('./routes/login'))
const SignupPage = lazy(() => import('./routes/signup'))
const CallbackPage = lazy(() => import('./routes/callback'))
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
      <AuthLayout />
    ),
    // the main views have routes (app/nav.ts), and so do the places the rail reaches: with the rail they are views,
    // with the header pill their routes open them as screens over the dashboard. Every other child view is a screen.
    children: [
      { index: true, element: <Navigate to="today" replace /> },
      { path: 'dashboard', element: <Navigate to="/app/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'guests', element: <GuestsPage /> },
      { path: 'retreats', element: <RetreatsPage /> },
      { path: 'reviews', element: <ReviewsPage /> },
      { path: 'care', element: <CarePage /> },
      { path: 'portal', element: <PortalPage /> },
      { path: 'blueprint', element: <BlueprintPage /> },
      { path: 'design', element: <RailView id="design" /> },
      { path: 'profile', element: <RailView id="profile" /> },
      { path: 'settings', element: <RailView id="settings" /> },
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
