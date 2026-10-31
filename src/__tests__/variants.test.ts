import { describe, expect, it } from 'vitest'
import tokens from '../../design-system/tokens.json'

// WCAG relative luminance and contrast, for hex colors
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

type Look = Record<string, string>
const base = (look: 'light' | 'dark'): Look => Object.fromEntries(tokens.color.tokens.map((t) => [t.name, (t.value as Look)[look]]))

describe('Every variant, light and dark', () => {
  for (const v of tokens.variants.list)
    for (const look of ['light', 'dark'] as const)
      it(`${v.name} (${look}) keeps text at 4.5:1 and control edges at 3:1`, () => {
        const c = { ...base(look), ...(v[look] as Look) }
        for (const bg of [c.ground, c.panel, c.band]) {
          for (const k of ['text', 'dim', 'accent', 'ok', 'watch', 'fault', 'need', 'done', 'paused']) expect(contrast(c[k], bg), `${k} on ${bg}`).toBeGreaterThanOrEqual(4.5)
          expect(contrast(c.edge, bg), `edge on ${bg}`).toBeGreaterThanOrEqual(3)
        }
        expect(contrast(c.primary, c['on-primary'])).toBeGreaterThanOrEqual(4.5)
      })
})
