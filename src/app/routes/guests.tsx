// Guests: every guest by stage, one record each (insight I02). The list filters by stage; a row opens the guest's
// record as a screen. New inquiry opens the form that adds a guest as a side panel (screens/new-inquiry.tsx).
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { openScreen } from '@/stores/screens'
import { Sec } from '@/components/system/status'
import { ACTIVE_STAGES, STAGES, type StageId } from '@/os/model'
import { useOs } from '@/os/store'
import { ExampleNote, GuestList, ViewHead } from '@/os/ui'

type Show = StageId | 'active' | 'exits'

export default function GuestsPage() {
  const guests = useOs((s) => s.guests)
  const [show, setShow] = useState<Show>('active')
  const exits = STAGES.filter((s) => s.exit).map((s) => s.id)
  const rows = guests
    .filter((g) => (show === 'active' ? !exits.includes(g.stage) : show === 'exits' ? exits.includes(g.stage) : g.stage === show))
    .sort((a, b) => STAGES.findIndex((s) => s.id === a.stage) - STAGES.findIndex((s) => s.id === b.stage) || a.since.localeCompare(b.since))
  const filters: { id: Show; word: string; n: number }[] = [
    { id: 'active', word: 'On the journey', n: guests.filter((g) => !exits.includes(g.stage)).length },
    ...ACTIVE_STAGES.map((s) => ({ id: s.id, word: s.word, n: guests.filter((g) => g.stage === s.id).length })),
    { id: 'exits', word: 'Left', n: guests.filter((g) => exits.includes(g.stage)).length },
  ]
  return (
    <div className="arrive grid items-start gap-y-6">
      <ViewHead
        label={<>Operations · <ExampleNote /></>}
        title="Guests"
        lead="One record per guest, from the first inquiry to retention. Stage is a field with a date, so the list reads the same in every view."
        side={
          <button type="button" data-door="new-inquiry" className="pill go" onClick={(e) => openScreen('new-inquiry', undefined, e.currentTarget)}>
            <Plus size={14} strokeWidth={1.75} aria-hidden="true" /> New inquiry
          </button>
        }
      />
      <section aria-labelledby="list-h" className="grid min-w-0 content-start gap-3.5">
        <Sec id="list-h">{filters.find((x) => x.id === show)!.word}</Sec>
        <div role="radiogroup" aria-label="Show guests" className="state-switch w-fit flex-wrap !rounded-[16px]">
          {filters.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={show === x.id} onClick={() => setShow(x.id)} className="!px-3 !py-2">
              {x.word} <span className="tabular-nums opacity-70">{x.n}</span>
            </button>
          ))}
        </div>
        <GuestList guests={rows} empty="No guest is at this stage right now. Pick another stage, or add an inquiry." />
      </section>
    </div>
  )
}
