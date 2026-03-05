import { useAuth0 } from '@auth0/auth0-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isAuthEnabled } from '@/lib/auth'

export default function SignupPage() {
  if (!isAuthEnabled) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Auth Not Configured</CardTitle>
            <CardDescription>
              Set <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_AUTH0_DOMAIN</code> and{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_AUTH0_CLIENT_ID</code> in your{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> to enable authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/app/dashboard">Continue without auth</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <SignupWithAuth0 />
}

function SignupWithAuth0() {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Get started with {import.meta.env.VITE_APP_NAME || 'App'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
          >
            Sign up
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
