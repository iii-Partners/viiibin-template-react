import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isAuthEnabled } from '@/lib/auth'

export default function LoginPage() {
  if (!isAuthEnabled) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Demo Mode</CardTitle>
            <CardDescription>
              Authentication is not configured. Explore the app freely in demo mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <a href="/app/dashboard">Continue to App</a>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Configure Auth0 in your <code className="rounded bg-muted px-1 py-0.5">.env</code> file to enable authentication.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <LoginWithAuth0 />
}

function LoginWithAuth0() {
  const { loginWithPopup } = useAuth0()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await loginWithPopup()
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      // User closed popup or auth failed
      if (err instanceof Error && err.message !== 'Popup closed') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
