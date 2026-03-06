import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'

export const supportedLocales = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
] as const

export type SupportedLocale = (typeof supportedLocales)[number]['code']

// Lazy-load translations for non-default languages
const lazyResources: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  es: () => import('./locales/es.json'),
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: 'en',
    supportedLngs: supportedLocales.map((l) => l.code),
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'viiibin-language',
      caches: ['localStorage'],
    },
  })

// Load the detected language if it is not English
const detectedLng = i18n.language?.split('-')[0] // e.g., 'es-MX' -> 'es'
if (detectedLng && detectedLng !== 'en' && detectedLng in lazyResources) {
  lazyResources[detectedLng]().then((module) => {
    i18n.addResourceBundle(detectedLng, 'translation', module.default, true, true)
  })
}

/**
 * Dynamically loads a locale's translations and switches to it.
 */
export async function loadAndSetLocale(locale: string): Promise<void> {
  if (!i18n.hasResourceBundle(locale, 'translation')) {
    const loader = lazyResources[locale]
    if (loader) {
      const module = await loader()
      i18n.addResourceBundle(locale, 'translation', module.default, true, true)
    }
  }
  await i18n.changeLanguage(locale)
}

export default i18n
