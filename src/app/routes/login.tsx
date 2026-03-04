import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  // TODO: Integrate Auth0 login (issue #33)
  const handleLogin = () => {
    console.log('Login clicked — Auth0 integration pending')
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLogin}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
