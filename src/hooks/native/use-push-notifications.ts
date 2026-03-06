import { useCallback, useEffect, useRef, useState } from 'react'
import { isNative } from '@/lib/utils/platform'

type PushPermissionStatus = 'prompt' | 'granted' | 'denied'

type PushNotificationData = {
  id?: string
  title?: string
  body?: string
  data?: Record<string, unknown>
}

type NotificationHandler = (notification: PushNotificationData) => void

/**
 * Wraps @capacitor/push-notifications for native push notification support.
 * On web, returns null token and no-op functions.
 *
 * Usage:
 * ```tsx
 * const { token, permission, requestPermission, onNotification } = usePushNotifications()
 *
 * useEffect(() => {
 *   if (token) {
 *     // Send token to your backend
 *     api.post('/push/register', { token })
 *   }
 * }, [token])
 *
 * useEffect(() => {
 *   return onNotification((notification) => {
 *     console.log('Received:', notification)
 *   })
 * }, [onNotification])
 * ```
 */
export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<PushPermissionStatus>('prompt')
  const notificationHandlersRef = useRef<NotificationHandler[]>([])

  const onNotification = useCallback((handler: NotificationHandler) => {
    notificationHandlersRef.current.push(handler)
    return () => {
      notificationHandlersRef.current = notificationHandlersRef.current.filter((h) => h !== handler)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<PushPermissionStatus> => {
    if (!isNative) return 'denied'

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      let permStatus = await PushNotifications.checkPermissions()
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      const status = permStatus.receive as PushPermissionStatus
      setPermission(status)

      if (status === 'granted') {
        await PushNotifications.register()
      }

      return status
    } catch (error) {
      console.error('Failed to request push notification permission:', error)
      return 'denied'
    }
  }, [])

  useEffect(() => {
    if (!isNative) return

    const listeners: Array<{ remove: () => void }> = []

    const setup = async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      // Check current permission status
      const permStatus = await PushNotifications.checkPermissions()
      setPermission(permStatus.receive as PushPermissionStatus)

      // Listen for registration success
      const regHandle = await PushNotifications.addListener('registration', (regToken) => {
        setToken(regToken.value)
      })
      listeners.push(regHandle)

      // Listen for registration errors
      const regErrorHandle = await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration failed:', error)
      })
      listeners.push(regErrorHandle)

      // Listen for received notifications (foreground)
      const receivedHandle = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          const data: PushNotificationData = {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            data: notification.data as Record<string, unknown>,
          }
          for (const handler of notificationHandlersRef.current) {
            handler(data)
          }
        },
      )
      listeners.push(receivedHandle)

      // Listen for notification tap (background/closed)
      const actionHandle = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          const notification = action.notification
          const data: PushNotificationData = {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            data: notification.data as Record<string, unknown>,
          }
          for (const handler of notificationHandlersRef.current) {
            handler(data)
          }
        },
      )
      listeners.push(actionHandle)

      // If already granted, register to get token
      if (permStatus.receive === 'granted') {
        await PushNotifications.register()
      }
    }

    setup().catch(console.error)

    return () => {
      for (const listener of listeners) {
        listener.remove()
      }
    }
  }, [])

  return {
    token,
    permission,
    requestPermission,
    onNotification,
  }
}

export type { PushNotificationData, PushPermissionStatus }
