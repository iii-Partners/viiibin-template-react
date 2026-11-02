import VARIANTS from '@/design/variants.json'

/**
 * The app's look: always Northlight (design-system/tokens.json, `variants.list`, id `northlight`).
 *
 * This module sets `data-variant="northlight"` on <html> and loads Northlight's Google Fonts when it is imported,
 * before the first paint; tokens.css holds the values. Nothing in the app switches the look. Earlier builds saved a
 * picked variant under the localStorage key `variant`; this module deletes that key, so no saved choice applies.
 */
export const VARIANT = 'northlight'

/** Sets Northlight on <html>, adds its fonts stylesheet once, and deletes any variant an earlier build saved. */
export function applyNorthlight() {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.variant = VARIANT
  const fonts = VARIANTS.find((v) => v.id === VARIANT)?.fonts
  if (fonts && !document.getElementById(`fonts-${VARIANT}`)) {
    const link = document.createElement('link')
    link.id = `fonts-${VARIANT}`
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${fonts}&display=swap`
    document.head.appendChild(link)
  }
  try {
    globalThis.localStorage?.removeItem('variant')
  } catch {
    // storage can be blocked; the look does not depend on it
  }
}

applyNorthlight()
