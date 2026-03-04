import { Link } from 'react-router'

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'App'}. All rights reserved.
        </p>
        <nav className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
