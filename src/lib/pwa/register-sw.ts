/**
 * Service Worker Registration
 *
 * Registers the service worker and handles update notifications.
 * When a new version is available, dispatches a custom event
 * that the usePWA hook listens for.
 */

type ServiceWorkerConfig = {
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onSuccess?: (registration: ServiceWorkerRegistration) => void
}

export function registerServiceWorker(config?: ServiceWorkerConfig): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (!installingWorker) return

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state !== 'installed') return

          if (navigator.serviceWorker.controller) {
            // New content is available — notify the app
            window.dispatchEvent(
              new CustomEvent('sw-update-available', {
                detail: { registration },
              }),
            )
            config?.onUpdate?.(registration)
          } else {
            // Content is cached for the first time
            config?.onSuccess?.(registration)
          }
        })
      })
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  })
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve(false)
  }

  return navigator.serviceWorker.ready.then((registration) => {
    return registration.unregister()
  })
}
