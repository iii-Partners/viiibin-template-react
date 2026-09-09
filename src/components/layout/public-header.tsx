import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * Public marketing header — responsive by design so it also looks right as the
 * Capacitor mobile app (same code). Desktop (>=md): logo + inline nav + auth
 * buttons in one row. Mobile: logo + a hamburger that toggles a stacked panel,
 * so nothing overflows or clips on a phone-width viewport.
 */
export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const appName = import.meta.env.VITE_APP_NAME || 'App'
  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        <Link to="/" className="flex items-center space-x-2" onClick={close}>
          <span className="font-bold">{appName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-6 text-sm font-medium md:flex">
          <Link to="/features" className="text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link to="/pricing" className="text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
        </nav>

        {/* Desktop auth actions */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3 text-sm font-medium">
            <Link
              to="/features"
              onClick={close}
              className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              onClick={close}
              className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Pricing
            </Link>
            <div className="mt-2 flex flex-col gap-2">
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link to="/login" onClick={close}>
                  Log in
                </Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link to="/signup" onClick={close}>
                  Sign up
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
