import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import VARIANTS from '@/design/variants.json'

/**
 * Variant store — which design variant the app wears (design-system/tokens.json, variants).
 *
 * The variant is set as `data-variant` on <html>; tokens.css holds each variant's values. Its Google Fonts load the
 * first time it is picked, never before.
 * Persistence: localStorage. Hydration: 1st, like the theme, so the page never flashes the default.
 */
export type VariantInfo = (typeof VARIANTS)[number]
export const VARIANT_LIST: VariantInfo[] = VARIANTS

/** Adds a variant's Google Fonts stylesheet once. */
export function loadVariantFonts(id: string) {
  const v = VARIANT_LIST.find((x) => x.id === id)
  if (typeof document === 'undefined' || !v?.fonts || document.getElementById(`fonts-${id}`)) return
  const link = document.createElement('link')
  link.id = `fonts-${id}`
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${v.fonts}&display=swap`
  document.head.appendChild(link)
}

function applyVariant(id: string) {
  if (typeof document === 'undefined') return
  if (id === 'modern') delete document.documentElement.dataset.variant
  else document.documentElement.dataset.variant = id
  loadVariantFonts(id)
}

/** A saved id that no longer exists (a renamed or removed variant) becomes Northlight. */
const known = (id?: string) => (id && VARIANT_LIST.some((v) => v.id === id) ? id : 'northlight')

// apply the saved variant on import, before the first paint; Northlight when nothing current is saved
try {
  const saved = JSON.parse(globalThis.localStorage?.getItem('variant') ?? 'null')
  applyVariant(saved?.version >= 1 ? known(saved?.state?.id) : 'northlight')
} catch {
  applyVariant('northlight')
}

export const useVariantStore = create<{ id: string; setVariant(id: string): void }>()(
  persist(
    (set) => ({
      id: 'northlight',
      setVariant: (id) => {
        applyVariant(id)
        set({ id })
      },
    }),
    {
      name: 'variant',
      // version 1 made Northlight the variant for now, whatever was picked before; version 2 maps ids that no longer exist
      version: 2,
      migrate: (saved, version) => ({ ...(saved as { id: string }), id: version < 1 ? 'northlight' : known((saved as { id?: string })?.id) }),
      onRehydrateStorage: () => (s) => s && applyVariant(s.id),
    },
  ),
)
