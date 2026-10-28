// The state switch on a part in the live UI: a row of small chips above the part's top right (Happy, Empty, Loading,
// Error, Live) that moves that one part between its states, so a prototype shows every state where it lives. It sits
// in the same place whatever the part shows, so the viewer can switch back from any state. A prototype tool: Settings
// turns the switches off, and then every part shows live data.
import type { ReactNode } from 'react'
import { usePreferencesStore } from '@/stores/preferences'
import { PREVIEW_STATES, usePreview, usePreviewOf } from '@/stores/preview'
import { cn } from '@/lib/utils/cn'

export function StateSwitch({ part, label, className }: { part: string; label: string; className?: string }) {
  const on = usePreferencesStore((s) => s.stateSwitches)
  const state = usePreviewOf(part)
  if (!on) return null
  return (
    <div role="radiogroup" aria-label={`${label}: preview a state`} className={cn('state-switch', className)}>
      {PREVIEW_STATES.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={state === s.id} onClick={() => usePreview.getState().set(part, s.id)}>
          {s.word}
        </button>
      ))}
    </div>
  )
}

/** A part with its state switch on the shelf above its top right, beside the folder tab, over whichever state it
 *  shows; it never covers the part's own content. */
export function Previewable({ part, label, children, className }: { part: string; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid min-w-0', className)}>
      <StateSwitch part={part} label={label} className="relative z-[2] -mb-3 justify-self-end" />
      {children}
    </div>
  )
}
