import { useState, useCallback, useMemo } from 'react'
import { consentManager, type ConsentCategory, type ConsentState } from '@/lib/analytics/consent'
import { applyAnalyticsConsent } from '@/lib/analytics'

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
    // Granted: PostHog on the fleet schema (when configured). Revoked: back to the no-op provider.
    applyAnalyticsConsent()
  }, [])

  const acceptAll = useCallback(() => {
    const newConsent = consentManager.acceptAll()
    setConsentState(newConsent)
    setHasConsented(true)
    applyAnalyticsConsent()
  }, [])

  const rejectAll = useCallback(() => {
    const newConsent = consentManager.rejectAll()
    setConsentState(newConsent)
    setHasConsented(true)
    applyAnalyticsConsent()
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
