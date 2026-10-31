import { Link } from 'react-router'
import { isAuthEnabled } from '@/lib/auth'

// The landing page as a title screen, after the deck's title slide: a tracked label, the app's name in large
// Newsreader light with one italic word, one line on what it does, and the way in as a pill.
export default function LandingPage() {
  const appName = import.meta.env.VITE_APP_NAME || 'Your App'
  const appDescription =
    import.meta.env.VITE_APP_DESCRIPTION ||
    'A fast, modern starting point. Explore the app, then make it your own.'

  return (
    <div className="arrive mx-auto grid max-w-[920px] justify-items-center gap-8 px-safe py-28 text-center">
      <small className="eyebrow">Ready</small>
      <h1 className="text-[48px]/[1.04] tracking-[-0.012em] sm:text-[84px]">
        <em>Welcome</em> to {appName}
      </h1>
      <p className="max-w-[52ch] text-[18px]/[1.6] font-light text-dim">{appDescription}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isAuthEnabled ? (
          <>
            <Link to="/signup" className="pill go">
              Get started
            </Link>
            <Link to="/login" className="pill">
              Log in
            </Link>
          </>
        ) : (
          // No auth configured (the default for a fresh preview): send people
          // straight into the app rather than to a login that isn't set up yet.
          <Link to="/app/dashboard" className="pill go">
            Explore the app
          </Link>
        )}
      </div>
    </div>
  )
}
