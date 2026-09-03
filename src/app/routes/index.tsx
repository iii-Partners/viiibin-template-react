import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { isAuthEnabled } from '@/lib/auth'

export default function LandingPage() {
  const appName = import.meta.env.VITE_APP_NAME || 'Your App'
  const appDescription =
    import.meta.env.VITE_APP_DESCRIPTION ||
    'A fast, modern starting point. Explore the app, then make it your own.'

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Welcome to{' '}
        <span className="text-primary">{appName}</span>
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">{appDescription}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {isAuthEnabled ? (
          <>
            <Button size="lg" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </>
        ) : (
          // No auth configured (the default for a fresh preview): send people
          // straight into the app rather than to a login that isn't set up yet.
          <Button size="lg" asChild>
            <Link to="/dashboard">Explore the app</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
