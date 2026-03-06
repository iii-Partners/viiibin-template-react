/**
 * Accessibility Utilities
 *
 * Helpers for WCAG 2.1 AA compliance including screen reader
 * announcements and color contrast ratio calculations.
 */

let liveRegion: HTMLElement | null = null

/**
 * Announces a message to screen readers via an aria-live region.
 * Creates a visually hidden live region if one does not yet exist.
 *
 * @param message - The text to announce
 * @param priority - 'polite' waits for idle, 'assertive' interrupts immediately
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
): void {
  if (typeof document === 'undefined') return

  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.setAttribute('role', 'status')
    Object.assign(liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: '0',
    })
    document.body.appendChild(liveRegion)
  }

  // Update priority if it changed
  liveRegion.setAttribute('aria-live', priority)

  // Clear and re-set to ensure screen readers pick up the change
  liveRegion.textContent = ''
  requestAnimationFrame(() => {
    if (liveRegion) {
      liveRegion.textContent = message
    }
  })
}

/**
 * Parses a hex color string (#RGB, #RRGGBB, or #RRGGBBAA) into
 * an object with r, g, b values (0-255).
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '')

  // Expand shorthand (#RGB -> #RRGGBB)
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    cleanHex = cleanHex
      .slice(0, 3)
      .split('')
      .map((c) => c + c)
      .join('')
  }

  // Take only RGB (ignore alpha if present)
  cleanHex = cleanHex.slice(0, 6)

  const num = parseInt(cleanHex, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/**
 * Calculates the relative luminance of a color per WCAG 2.1.
 * See: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculates the WCAG 2.1 contrast ratio between two hex colors.
 * Returns a value between 1 (no contrast) and 21 (max contrast).
 *
 * WCAG 2.1 AA requirements:
 *  - Normal text: >= 4.5
 *  - Large text (18pt+ or 14pt+ bold): >= 3.0
 *  - UI components / graphical objects: >= 3.0
 *
 * @param fg - Foreground color as hex string (e.g., '#000000')
 * @param bg - Background color as hex string (e.g., '#FFFFFF')
 * @returns The contrast ratio rounded to two decimal places
 */
export function getContrastRatio(fg: string, bg: string): number {
  const fgColor = parseHexColor(fg)
  const bgColor = parseHexColor(bg)

  const l1 = relativeLuminance(fgColor.r, fgColor.g, fgColor.b)
  const l2 = relativeLuminance(bgColor.r, bgColor.g, bgColor.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100
}
