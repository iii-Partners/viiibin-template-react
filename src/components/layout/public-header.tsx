import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">{import.meta.env.VITE_APP_NAME || 'App'}</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link to="/features" className="text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link to="/pricing" className="text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
