/**
 * Deep link configuration for mapping external URLs to internal routes.
 *
 * NOTE: For Universal Links (iOS) and App Links (Android) to work in production,
 * the deploy domain must serve the following files:
 * - /.well-known/apple-app-site-association (AASA) — iOS Universal Links
 * - /.well-known/assetlinks.json — Android App Links
 * These associate the domain with the native app bundle ID / package name.
 */

/**
 * A route definition that maps a URL pattern to a react-router path.
 *
 * The `pattern` is matched against the pathname of the incoming URL.
 * Supports simple `:param` placeholders that map to the `routerPath`.
 *
 * Example:
 * ```ts
 * { pattern: '/items/:id', routerPath: '/app/items/:id' }
 * ```
 */
type DeepLinkRoute = {
  /** URL path pattern (e.g., '/items/:id', '/profile') */
  pattern: string
  /** Target react-router path (e.g., '/app/items/:id', '/app/profile') */
  routerPath: string
}

type DeepLinkRouteMap = DeepLinkRoute[]

/**
 * Match an incoming deep link URL against configured route patterns.
 * Returns the resolved react-router path, or null if no match.
 */
function matchDeepLink(url: string, routes: DeepLinkRouteMap): string | null {
  let pathname: string

  try {
    const parsed = new URL(url)
    pathname = parsed.pathname
  } catch {
    // If URL parsing fails, treat the whole string as a path
    pathname = url
  }

  // Normalize: remove trailing slash (but keep root '/')
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1)
  }

  for (const route of routes) {
    const params = matchPattern(route.pattern, pathname)
    if (params !== null) {
      return resolveRouterPath(route.routerPath, params)
    }
  }

  return null
}

/**
 * Match a URL pathname against a pattern with :param placeholders.
 * Returns extracted params or null if no match.
 */
function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      // Dynamic segment
      params[patternPart.slice(1)] = pathPart
    } else if (patternPart !== pathPart) {
      return null
    }
  }

  return params
}

/**
 * Replace :param placeholders in a router path with actual values.
 */
function resolveRouterPath(routerPath: string, params: Record<string, string>): string {
  let resolved = routerPath
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(`:${key}`, value)
  }
  return resolved
}

export { matchDeepLink, matchPattern, resolveRouterPath }
export type { DeepLinkRoute, DeepLinkRouteMap }
