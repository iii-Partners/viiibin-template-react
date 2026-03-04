import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Welcome to{' '}
        <span className="text-primary">{import.meta.env.VITE_APP_NAME || 'App'}</span>
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {import.meta.env.VITE_APP_DESCRIPTION || 'Build something amazing.'}
      </p>
      <div className="flex gap-4">
        <Button size="lg" asChild>
          <Link to="/signup">Get Started</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/login">Log in</Link>
        </Button>
      </div>
    </div>
  )
}
