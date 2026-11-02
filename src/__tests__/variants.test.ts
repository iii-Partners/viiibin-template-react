import { beforeEach, describe, expect, it, vi } from 'vitest'
import tokens from '../../design-system/tokens.json'
import VARIANTS from '@/design/variants.json'

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

describe('The look', () => {
  beforeEach(() => {
    vi.resetModules()
    delete document.documentElement.dataset.variant
    document.getElementById('fonts-northlight')?.remove()
    localStorage.clear()
  })

  it('is Northlight on load, with its fonts', async () => {
    await import('@/stores/variant')
    expect(document.documentElement.dataset.variant).toBe('northlight')
    const link = document.getElementById('fonts-northlight') as HTMLLinkElement | null
    const fonts = VARIANTS.find((v) => v.id === 'northlight')!.fonts
    expect(link?.getAttribute('href')).toBe(`https://fonts.googleapis.com/css2?${fonts}&display=swap`)
  })

  it('stays Northlight when an earlier build saved another variant, and deletes the saved choice', async () => {
    localStorage.setItem('variant', JSON.stringify({ state: { id: 'aman' }, version: 2 }))
    await import('@/stores/variant')
    expect(document.documentElement.dataset.variant).toBe('northlight')
    expect(localStorage.getItem('variant')).toBeNull()
  })

  it('offers no way to switch', async () => {
    const mod = await import('@/stores/variant')
    expect(Object.keys(mod).sort()).toEqual(['VARIANT', 'applyNorthlight'])
    expect(mod.VARIANT).toBe('northlight')
  })
})
