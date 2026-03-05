import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { isAuthEnabled } from '@/lib/auth'

export default function CallbackPage() {
  if (!isAuthEnabled) {
    return <CallbackRedirect />
  }

  return <Auth0Callback />
}

function CallbackRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/app/dashboard', { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text="Redirecting..." />
    </div>
  )
}

function Auth0Callback() {
  const { isAuthenticated, isLoading, error } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h2 className="text-xl font-semibold">Sign-in failed</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text="Signing you in..." />
    </div>
  )
}
