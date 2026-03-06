import { useCallback, useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/use-pwa'

const DISMISSAL_KEY = 'pwa-install-prompt-dismissed'
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA()
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISSAL_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt)
      setIsDismissed(elapsed < DISMISSAL_DURATION_MS)
    } else {
      setIsDismissed(false)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()))
    setIsDismissed(true)
  }, [])

  const handleInstall = useCallback(async () => {
    const accepted = await promptInstall()
    if (accepted) {
      setIsDismissed(true)
    }
  }, [promptInstall])

  if (!isInstallable || isDismissed) return null

  return (
    <div
      role="complementary"
      aria-label="Install application"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border bg-card p-4 shadow-lg sm:left-auto sm:right-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Download className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Add to Home Screen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Install this app for a faster, native-like experience.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
