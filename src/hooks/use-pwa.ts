import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type UsePWAReturn = {
  /** Whether the browser has offered the install prompt */
  isInstallable: boolean
  /** Whether the app is already installed (running in standalone mode) */
  isInstalled: boolean
  /** Trigger the native install prompt. Returns true if accepted. */
  promptInstall: () => Promise<boolean>
  /** Whether a new service worker version is waiting to activate */
  isUpdateAvailable: boolean
}

export function usePWA(): UsePWAReturn {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [isInstalled, setIsInstalled] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)

  useEffect(() => {
    // Detect standalone display mode (already installed)
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    setIsInstalled(mediaQuery.matches || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true))

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches)
    }
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPromptEvent(null)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    // Listen for service worker update events (dispatched by register-sw.ts)
    const handleSWUpdate = () => {
      setIsUpdateAvailable(true)
    }
    window.addEventListener('sw-update-available', handleSWUpdate)

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('sw-update-available', handleSWUpdate)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPromptEvent) return false

    await installPromptEvent.prompt()
    const { outcome } = await installPromptEvent.userChoice
    if (outcome === 'accepted') {
      setInstallPromptEvent(null)
    }
    return outcome === 'accepted'
  }, [installPromptEvent])

  return {
    isInstallable: installPromptEvent !== null && !isInstalled,
    isInstalled,
    promptInstall,
    isUpdateAvailable,
  }
}
