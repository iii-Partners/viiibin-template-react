import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supportedLocales, loadAndSetLocale, type SupportedLocale } from '@/lib/i18n'

type UseLocaleReturn = {
  /** Current active locale code (e.g., 'en', 'es') */
  locale: SupportedLocale
  /** Switch to a different locale. Lazy-loads translations if needed. */
  setLocale: (locale: SupportedLocale) => Promise<void>
  /** Translation function — same as react-i18next's `t` */
  t: ReturnType<typeof useTranslation>['t']
  /** List of all supported locales with display labels */
  supportedLocales: typeof supportedLocales
}

/**
 * Convenience hook wrapping react-i18next's useTranslation with
 * locale switching and the list of supported locales.
 */
export function useLocale(): UseLocaleReturn {
  const { t, i18n } = useTranslation()

  const setLocale = useCallback(
    async (locale: SupportedLocale) => {
      await loadAndSetLocale(locale)
    },
    [],
  )

  return {
    locale: (i18n.language?.split('-')[0] || 'en') as SupportedLocale,
    setLocale,
    t,
    supportedLocales,
  }
}
