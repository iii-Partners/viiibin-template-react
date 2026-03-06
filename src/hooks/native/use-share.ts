import { useCallback, useMemo } from 'react'
import { isNative } from '@/lib/utils/platform'

type ShareOptions = {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
}

type ShareResult = {
  activityType?: string
}

/**
 * Wraps @capacitor/share for native platforms, falling back to
 * Web Share API (navigator.share) where available.
 */
export function useShare() {
  const canShare = useMemo(() => {
    if (isNative) return true
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  }, [])

  const share = useCallback(
    async (options: ShareOptions): Promise<ShareResult | undefined> => {
      if (isNative) {
        const { Share } = await import('@capacitor/share')
        const result = await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle,
        })
        return { activityType: result.activityType ?? undefined }
      }

      // Web fallback
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        })
        return undefined
      }

      console.warn('Share API is not available on this platform')
      return undefined
    },
    [],
  )

  return { share, canShare }
}
