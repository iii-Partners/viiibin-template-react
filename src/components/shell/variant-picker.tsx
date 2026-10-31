// The design variants as a choice. Each card is drawn in its own variant (data-variant-scope), so the choice shows
// before it is made: the name in the variant's display face, its ground, ink, primary and accent, and a button in its
// shape. Picking one applies it to the whole app at once and keeps it in this browser. `gallery` shows the note and the
// signature token too (the Design system screen); otherwise the cards are compact (Settings).
import { useEffect } from 'react'
import { loadVariantFonts, useVariantStore, VARIANT_LIST } from '@/stores/variant'
import { cn } from '@/lib/utils/cn'

export function VariantPicker({ gallery = false }: { gallery?: boolean }) {
  const id = useVariantStore((s) => s.id)
  const setVariant = useVariantStore((s) => s.setVariant)
  // every card shows its own type, so every variant's fonts load while the picker is open
  useEffect(() => VARIANT_LIST.forEach((v) => loadVariantFonts(v.id)), [])
  return (
    <div role="radiogroup" aria-label="Design variant" className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gallery ? 260 : 190}px, 1fr))` }}>
      {VARIANT_LIST.map((v) => (
        <button
          key={v.id}
          type="button"
          role="radio"
          aria-checked={id === v.id}
          data-variant-scope={v.id}
          onClick={() => setVariant(v.id)}
          className={cn('grid min-w-0 content-start gap-3 overflow-hidden border p-4 text-left text-text transition-[border-color,box-shadow] duration-(--dur-hover)', id === v.id ? 'border-text shadow-[0_0_0_1px_var(--text)]' : 'border-line hover:border-edge')}
          style={{ background: 'var(--ground)', fontFamily: 'var(--font-body)', borderRadius: 'var(--panel-radius)' }}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="font-display text-[22px]/[1.1] font-light">{v.name}</span>
            {id === v.id && <span className="eyebrow ink !text-[10px]">In use</span>}
          </span>
          <span className="flex gap-1" aria-hidden="true">
            {['--text', '--primary', '--accent', '--band', '--panel', '--line'].map((c) => (
              <i key={c} className="block h-5 flex-1 border border-line" style={{ background: `var(${c})` }} />
            ))}
          </span>
          <span className="flex flex-wrap items-center gap-2" aria-hidden="true">
            <span className="pill go sm pointer-events-none">Approve</span>
            <span className="pill sm pointer-events-none">Later</span>
          </span>
          {gallery && (
            <>
              <span className="text-[13px]/[1.5] text-dim">{v.note}</span>
              <span className="border-t border-line pt-2 text-[12px]/[1.45] text-dim"><b className="font-medium text-text">Signature.</b> {v.signature}</span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}
