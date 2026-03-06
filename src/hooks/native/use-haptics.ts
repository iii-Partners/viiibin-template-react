import { useCallback } from 'react'
import { isNative } from '@/lib/utils/platform'

type ImpactStyle = 'heavy' | 'medium' | 'light'

type NotificationType = 'success' | 'warning' | 'error'

/**
 * Wraps @capacitor/haptics for native haptic feedback.
 * Returns no-op functions on web.
 */
export function useHaptics() {
  const impact = useCallback(async (style: ImpactStyle = 'medium') => {
    if (!isNative) return

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      const styleMap: Record<string, typeof ImpactStyle[keyof typeof ImpactStyle]> = {
        heavy: ImpactStyle.Heavy,
        medium: ImpactStyle.Medium,
        light: ImpactStyle.Light,
      }
      await Haptics.impact({ style: styleMap[style] ?? ImpactStyle.Medium })
    } catch {
      // Haptics not available — silently ignore
    }
  }, [])

  const notification = useCallback(async (type: NotificationType = 'success') => {
    if (!isNative) return

    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics')
      const typeMap: Record<string, typeof NotificationType[keyof typeof NotificationType]> = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      }
      await Haptics.notification({ type: typeMap[type] ?? NotificationType.Success })
    } catch {
      // Haptics not available
    }
  }, [])

  const vibrate = useCallback(async (duration: number = 300) => {
    if (!isNative) return

    try {
      const { Haptics } = await import('@capacitor/haptics')
      await Haptics.vibrate({ duration })
    } catch {
      // Haptics not available
    }
  }, [])

  return { impact, notification, vibrate }
}
