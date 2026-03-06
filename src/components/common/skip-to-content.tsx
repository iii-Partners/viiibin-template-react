/**
 * Skip to Content Link
 *
 * Hidden link that becomes visible on focus, allowing keyboard users
 * to skip navigation and jump directly to the main content area.
 * The target element must have id="main-content".
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed left-2 top-2 z-[100] -translate-y-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to content
    </a>
  )
}
