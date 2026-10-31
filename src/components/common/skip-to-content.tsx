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
      className="fixed left-2 top-2 z-[100] -translate-y-[calc(100%+16px)] rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition-transform focus:translate-y-0 focus:outline-none"
    >
      Skip to content
    </a>
  )
}
