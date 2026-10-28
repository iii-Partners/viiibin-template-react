import { Link } from 'react-router'
import { isAuthEnabled } from '@/lib/auth'

// The landing page as a title screen: the app's name, one line on what it does, and the way in.
export default function LandingPage() {
  const appName = import.meta.env.VITE_APP_NAME || 'Your App'
  const appDescription =
    import.meta.env.VITE_APP_DESCRIPTION ||
    'A fast, modern starting point. Explore the app, then make it your own.'

  return (
    <div className="arrive mx-auto grid max-w-[880px] justify-items-center gap-7 px-safe py-24 text-center">
      <code className="rounded-chip border border-brand px-2 py-1 font-mono text-[11px]/none tracking-[0.08em] text-brand">READY</code>
      <h1 className="text-[44px]/[1.05] font-light tracking-[-0.04em] text-balance sm:text-[64px]">
        Welcome to <span className="text-brand">{appName}</span>
      </h1>
      <p className="max-w-[56ch] text-[17px]/[1.55] text-dim">{appDescription}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isAuthEnabled ? (
          <>
            <Link to="/signup" className="gm-btn go">
              Get started
            </Link>
            <Link to="/login" className="gm-btn">
              Log in
            </Link>
          </>
        ) : (
          // No auth configured (the default for a fresh preview): send people
          // straight into the app rather than to a login that isn't set up yet.
          <Link to="/app/dashboard" className="gm-btn go">
            Explore the app
          </Link>
        )}
      </div>
    </div>
  )
}
