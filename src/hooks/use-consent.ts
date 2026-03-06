import { useState, useCallback, useMemo } from 'react'
import { consentManager, type ConsentCategory, type ConsentState } from '@/lib/analytics/consent'
import { analytics } from '@/lib/analytics'
import { NoOpProvider } from '@/lib/analytics/provider'

/**
 * Hook for managing cookie/tracking consent.
 * Integrates with the analytics provider to disable tracking
 * when the user has not consented to analytics.
 */
export function useConsent() {
  const [consent, setConsentState] = useState<ConsentState>(() => consentManager.getConsent())
  const [hasConsented, setHasConsented] = useState(() => consentManager.hasUserConsented())

  const showBanner = !hasConsented

  const updateConsent = useCallback((updates: Partial<ConsentState>) => {
    const newConsent = consentManager.updateConsent(updates)
    setConsentState(newConsent)
    setHasConsented(true)

    // If analytics consent was revoked, swap to no-op provider
    if (!newConsent.analytics) {
      analytics.setProvider(new NoOpProvider())
    }
  }, [])

  const acceptAll = useCallback(() => {
    const newConsent = consentManager.acceptAll()
    setConsentState(newConsent)
    setHasConsented(true)
  }, [])

  const rejectAll = useCallback(() => {
    const newConsent = consentManager.rejectAll()
    setConsentState(newConsent)
    setHasConsented(true)
    analytics.setProvider(new NoOpProvider())
  }, [])

  const hasConsentFor = useCallback(
    (category: ConsentCategory) => consentManager.hasConsent(category),
    [],
  )

  return useMemo(
    () => ({
      consent,
      updateConsent,
      acceptAll,
      rejectAll,
      hasConsented,
      showBanner,
      hasConsentFor,
    }),
    [consent, updateConsent, acceptAll, rejectAll, hasConsented, showBanner, hasConsentFor],
  )
}
