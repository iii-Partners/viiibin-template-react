import { useNetwork } from '@/hooks/native/use-network'
import { cn } from '@/lib/utils/cn'
import { WifiOff } from 'lucide-react'

type OfflineBannerProps = {
  className?: string
}

/**
 * Displays a banner when the device is offline.
 * Auto-hides when connectivity returns.
 */
export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isConnected } = useNetwork()

  if (isConnected) return null

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-medium text-yellow-950',
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Changes will sync when connected.</span>
    </div>
  )
}
