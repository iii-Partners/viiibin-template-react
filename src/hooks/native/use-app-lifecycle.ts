import { useCallback, useEffect, useRef, useState } from 'react'
import { isNative } from '@/lib/utils/platform'

type StateChangeHandler = (isActive: boolean) => void
type UrlOpenHandler = (url: string) => void

/**
 * Wraps @capacitor/app state and URL events for app lifecycle monitoring.
 * On web, uses document visibility API as a fallback for state changes.
 */
export function useAppLifecycle() {
  const [isActive, setIsActive] = useState(true)
  const stateListenersRef = useRef<StateChangeHandler[]>([])
  const urlListenersRef = useRef<UrlOpenHandler[]>([])

  const addStateListener = useCallback((handler: StateChangeHandler) => {
    stateListenersRef.current.push(handler)
    return () => {
      stateListenersRef.current = stateListenersRef.current.filter((h) => h !== handler)
    }
  }, [])

  const addUrlListener = useCallback((handler: UrlOpenHandler) => {
    urlListenersRef.current.push(handler)
    return () => {
      urlListenersRef.current = urlListenersRef.current.filter((h) => h !== handler)
    }
  }, [])

  useEffect(() => {
    if (isNative) {
      const listeners: Array<{ remove: () => void }> = []

      const setup = async () => {
        const { App } = await import('@capacitor/app')

        const stateHandle = await App.addListener('appStateChange', ({ isActive: active }) => {
          setIsActive(active)
          for (const handler of stateListenersRef.current) {
            handler(active)
          }
        })
        listeners.push(stateHandle)

        const urlHandle = await App.addListener('appUrlOpen', ({ url }) => {
          for (const handler of urlListenersRef.current) {
            handler(url)
          }
        })
        listeners.push(urlHandle)
      }

      setup().catch(console.error)

      return () => {
        for (const listener of listeners) {
          listener.remove()
        }
      }
    }

    // Web fallback using visibility API
    const handleVisibilityChange = () => {
      const active = document.visibilityState === 'visible'
      setIsActive(active)
      for (const handler of stateListenersRef.current) {
        handler(active)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { isActive, addStateListener, addUrlListener }
}
