import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  // TODO: Integrate Auth0 signup (issue #33)
  const handleSignup = () => {
    console.log('Signup clicked — Auth0 integration pending')
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Get started with {import.meta.env.VITE_APP_NAME || 'App'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleSignup}>
            Sign up
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
