// The design reference as a screen: every part in the catalog (src/design/catalog.tsx), each with its own switch for
// its four states (happy path, empty, loading, error), and one switch at the top that sets them all. Then the design
// variants and the layers. The example data is invented. Delete the doors to this screen when the app no longer needs it.
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { CATALOG, GROUPS, SPEC_STATES, type Spec, type SpecState } from '@/design/catalog'
import { Sec, confirm } from '@/components/system'
import { VariantPicker } from '@/components/shell/variant-picker'
import { openScreen } from '@/stores/screens'
import { usePreferencesStore } from '@/stores/preferences'
import { cn } from '@/lib/utils/cn'

/** A state switch: the four states as a radio group in one small pill. */
function StateSwitch({ label, value, onChange, size = 'sm' }: { label: string; value: SpecState | null; onChange(s: SpecState): void; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="state-switch w-fit flex-wrap">
      {SPEC_STATES.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={value === s.id}
          onClick={() => onChange(s.id)}
          className={cn(size === 'md' && '!px-3.5 !py-2.5 !text-[10.5px]')}
        >
          {s.word}
        </button>
      ))}
    </div>
  )
}

function Specimen({ spec, state, onState }: { spec: Spec; state: SpecState; onState(s: SpecState): void }) {
  return (
    <section aria-labelledby={`spec-${spec.id}`} className="grid content-start gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5">
        <div className="grid min-w-0 gap-1">
          <h3 id={`spec-${spec.id}`} className="text-[24px]/[1.2]">{spec.name}</h3>
          <p className="text-[13.5px]/[1.5] text-dim">{spec.use}</p>
          <code className="font-mono text-[11px] text-dim">{spec.from}</code>
        </div>
        <StateSwitch label={`${spec.name}: state`} value={state} onChange={onState} />
      </div>
      {/* keyed by state, so each switch replays the part's arrival */}
      <div key={state} className="rise-in min-w-0">
        {spec.states[state]()}
      </div>
    </section>
  )
}

export function DesignScreen() {
  const rail = usePreferencesStore((s) => s.navStyle) === 'rail'
  const [all, setAll] = useState<SpecState | null>('happy')
  const [each, setEach] = useState<Record<string, SpecState>>({})
  const stateOf = (id: string) => each[id] ?? all ?? 'happy'
  const setOne = (id: string, s: SpecState) => {
    setEach((m) => ({ ...m, [id]: s }))
    setAll(null)
  }
  const setEvery = (s: SpecState) => {
    setAll(s)
    setEach({})
  }

  return (
    <div className="grid gap-12">
      <div className="grid gap-4">
        <p className="lead max-w-[60ch] text-dim">
          Every part of the system, in each state it can be in: the happy path, a fresh app with no data, data on its way, and data that did not come. Switch one part,
          or all of them at once. The example data is invented.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow">Show every part as</span>
          <StateSwitch label="Every part: state" value={all} onChange={setEvery} size="md" />
          {all === null && <span className="text-[12.5px] text-dim">Mixed: each part shows its own</span>}
        </div>
      </div>

      {GROUPS.map((g) => (
        <section key={g} aria-label={g} className="grid gap-7">
          <Sec>{g}</Sec>
          <div className="grid gap-x-10 gap-y-12 lg:grid-cols-2">
            {CATALOG.filter((s) => s.group === g).map((s) => (
              <Specimen key={s.id} spec={s} state={stateOf(s.id)} onState={(st) => setOne(s.id, st)} />
            ))}
          </div>
        </section>
      ))}

      <section className="grid gap-4">
        <Sec>Variants</Sec>
        <p className="max-w-[72ch] text-[14px]/[1.55] text-dim">
          The same parts in eleven looks. Each variant comes from a wellness brand’s public site (its CSS, read on October 30, 2026): its colors, the closest free
          fonts, button and panel shape, label tracking, heading case and motion. Every text color passes 4.5:1. Picking one applies it to the whole app.
        </p>
        <VariantPicker gallery />
      </section>

      <section className="grid gap-4">
        <Sec>Layers</Sec>
        <p className="max-w-[72ch] text-[14px]/[1.55] text-dim">
          {rail
            ? 'With the rail, everything the rail reaches is a view. Screens are for what opens from inside a view: an item from its row, then a confirm over it. Close or Esc steps back one layer at a time.'
            : 'A screen over a screen, then a confirm over both. Close or Esc steps back one layer at a time.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {!rail && (
            <button type="button" data-door="layer-profile" className="pill" onClick={(e) => openScreen('profile', undefined, e.currentTarget)}>
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> Open a screen over this one
            </button>
          )}
          <button type="button" className="pill" onClick={() => void confirm({ title: 'Ask before acting?', body: 'A confirm is the smallest layer. Cancel answers no.', action: 'Yes, act' })}>
            Ask with a confirm
          </button>
        </div>
      </section>
    </div>
  )
}
