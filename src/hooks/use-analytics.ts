import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router'
import { analytics } from '@/lib/analytics'

/**
 * Hook for analytics tracking.
 * Automatically tracks page views on route changes.
 * Returns helpers for manual event tracking.
 */
export function useAnalytics() {
  const location = useLocation()
  const prevPathRef = useRef<string>('')

  // Auto-track page views on route change
  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname
      analytics.page(location.pathname, {
        path: location.pathname,
        search: location.search,
        hash: location.hash,
      })
    }
  }, [location.pathname, location.search, location.hash])

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      analytics.track(event, properties)
    },
    [],
  )

  const page = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      analytics.page(name, properties)
    },
    [],
  )

  const identify = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      analytics.identify(userId, traits)
    },
    [],
  )

  return { track, page, identify }
}
