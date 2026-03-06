import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { isNative } from '@/lib/utils/platform'
import { matchDeepLink } from '@/lib/utils/deep-link-config'
import type { DeepLinkRouteMap } from '@/lib/utils/deep-link-config'

type DeepLinkHandler = (url: string, matchedPath: string | null) => void

/**
 * Listens for deep link / Universal Link / App Link URL open events
 * via @capacitor/app and navigates to the matched react-router path.
 *
 * NOTE: For Universal Links (iOS) and App Links (Android) to work,
 * the deploy domain must serve:
 * - /.well-known/apple-app-site-association (AASA) for iOS
 * - /.well-known/assetlinks.json for Android
 * These files associate the domain with the native app.
 */
export function useDeepLink(routes?: DeepLinkRouteMap) {
  const [lastDeepLink, setLastDeepLink] = useState<string | null>(null)
  const handlersRef = useRef<DeepLinkHandler[]>([])
  const navigate = useNavigate()

  const addHandler = useCallback((handler: DeepLinkHandler) => {
    handlersRef.current.push(handler)
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== handler)
    }
  }, [])

  useEffect(() => {
    if (!isNative) return

    let removeListener: (() => void) | undefined

    const setup = async () => {
      const { App } = await import('@capacitor/app')

      const handle = await App.addListener('appUrlOpen', ({ url }) => {
        setLastDeepLink(url)

        // Try to match against configured routes
        const matchedPath = routes ? matchDeepLink(url, routes) : null

        // Notify custom handlers
        for (const handler of handlersRef.current) {
          handler(url, matchedPath)
        }

        // Navigate if a route matched
        if (matchedPath) {
          navigate(matchedPath)
        }
      })

      removeListener = () => handle.remove()
    }

    setup().catch(console.error)

    return () => {
      removeListener?.()
    }
  }, [navigate, routes])

  return { lastDeepLink, addHandler }
}
