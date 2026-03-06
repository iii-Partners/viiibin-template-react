import { useCallback, useEffect, useRef, useState } from 'react'
import { isNative } from '@/lib/utils/platform'

type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown'

type NetworkStatus = {
  isConnected: boolean
  connectionType: ConnectionType
}

type StatusChangeHandler = (status: NetworkStatus) => void

/**
 * Monitors network connectivity via @capacitor/network on native platforms,
 * falling back to navigator.onLine for web.
 */
export function useNetwork() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  })
  const listenersRef = useRef<StatusChangeHandler[]>([])

  const onStatusChange = useCallback((handler: StatusChangeHandler) => {
    listenersRef.current.push(handler)
    return () => {
      listenersRef.current = listenersRef.current.filter((h) => h !== handler)
    }
  }, [])

  const notifyListeners = useCallback((newStatus: NetworkStatus) => {
    for (const handler of listenersRef.current) {
      handler(newStatus)
    }
  }, [])

  useEffect(() => {
    if (isNative) {
      let removeListener: (() => void) | undefined

      const setup = async () => {
        const { Network } = await import('@capacitor/network')

        // Get initial status
        const currentStatus = await Network.getStatus()
        const initial: NetworkStatus = {
          isConnected: currentStatus.connected,
          connectionType: mapConnectionType(currentStatus.connectionType),
        }
        setStatus(initial)

        // Listen for changes
        const handle = await Network.addListener('networkStatusChange', (change) => {
          const updated: NetworkStatus = {
            isConnected: change.connected,
            connectionType: mapConnectionType(change.connectionType),
          }
          setStatus(updated)
          notifyListeners(updated)
        })

        removeListener = () => handle.remove()
      }

      setup().catch(console.error)

      return () => {
        removeListener?.()
      }
    }

    // Web fallback using navigator.onLine
    const handleOnline = () => {
      const updated: NetworkStatus = { isConnected: true, connectionType: 'unknown' }
      setStatus(updated)
      notifyListeners(updated)
    }

    const handleOffline = () => {
      const updated: NetworkStatus = { isConnected: false, connectionType: 'none' }
      setStatus(updated)
      notifyListeners(updated)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [notifyListeners])

  return {
    isConnected: status.isConnected,
    connectionType: status.connectionType,
    onStatusChange,
  }
}

function mapConnectionType(type: string): ConnectionType {
  switch (type) {
    case 'wifi':
      return 'wifi'
    case 'cellular':
      return 'cellular'
    case 'none':
      return 'none'
    default:
      return 'unknown'
  }
}
