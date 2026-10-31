// Sessions and care: the practitioners' desk. Facilitators write session notes while a guest is on retreat, inside a
// record access window that closes three days after the retreat or when the notes are saved (the wish list). After
// the session, Integration Guides run the 48-hour check-in, log integration calls and finalize care; the Life
// Education Series runs on its own from the guest record.
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { openScreen } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { Sec, StatusWord } from '@/components/system/status'
import { Blank } from '@/components/system/empty'
import { addDays, fmt, retreatName, type Guest } from '@/os/model'
import { useOs } from '@/os/store'
import { useNeeds } from '@/os/needs'
import { ACTOR, ExampleNote, NeedList, ViewHead } from '@/os/ui'

function SessionNotes({ g }: { g: Guest }) {
  const { today, retreats, saveNotes, markComplete } = useOs()
  const r = retreats.find((x) => x.id === g.retreatId)
  const [text, setText] = useState(g.session?.notes ?? '')
  const closes = r ? addDays(r.end, 3) : today
  const open = !g.session?.notes && today <= closes
  return (
    <Panel className="gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <button type="button" className="text-left font-display text-[24px]/[1.2] font-light underline decoration-transparent underline-offset-4 hover:decoration-line" onClick={(e) => openScreen('guest', { id: g.id }, e.currentTarget)}>{g.name}</button>
          <span className="text-[13px] text-dim">{r && `${retreatName(r)} · room ${g.room} · ${r.facilitator}`}{g.returning && ' · returning guest'}</span>
        </div>
        <StatusWord st={open ? 'ok' : 'paused'}>{open ? `Access open until ${fmt(closes)}` : 'Access closed'}</StatusWord>
      </div>
      {g.session?.notes ? (
        <div className="grid gap-2 border-t border-line pt-4">
          <span className="eyebrow">Facilitator session notes · {g.session.notesBy} · {fmt(g.session.notesAt!)}</span>
          <p className="text-[15px]/[1.6] font-light">{g.session.notes}</p>
          {r && r.end <= today ? (
            <button type="button" className="pill go mt-2 w-fit" onClick={() => markComplete(g.id, ACTOR.operations)}>Mark complete</button>
          ) : (
            <p className="text-[13px] text-dim">Operations marks the session complete when the retreat ends on {r && fmt(r.end)}.</p>
          )}
        </div>
      ) : (
        <form className="grid gap-3 border-t border-line pt-4" onSubmit={(e) => { e.preventDefault(); if (text.trim() && r) saveNotes(g.id, text.trim(), r.facilitator) }}>
          <Label htmlFor={`notes-${g.id}`} className="!mb-0">Facilitator session notes</Label>
          <Textarea id={`notes-${g.id}`} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="How the session went, and anything the Integration Guide should know" disabled={!open} />
          <button type="submit" className="pill go w-fit" disabled={!text.trim() || !open}>Save notes and close access</button>
        </form>
      )}
    </Panel>
  )
}

function Integration({ g }: { g: Guest }) {
  const { logCheckIn, logCall, finalizeCare } = useOs()
  const by = g.integrator ?? 'Integration Guide'
  return (
    <Panel className="gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <button type="button" className="text-left font-display text-[22px]/[1.2] font-light underline decoration-transparent underline-offset-4 hover:decoration-line" onClick={(e) => openScreen('guest', { id: g.id }, e.currentTarget)}>{g.name}</button>
          <span className="text-[13px] text-dim">{by} · session ended {fmt(g.session?.completed ?? g.since)}</span>
        </div>
        {g.les && <StatusWord st={g.les.status === 'completed' ? 'done' : 'ok'}>{g.les.status === 'scheduled' ? `Living Well Series from ${fmt(g.les.start)}` : g.les.status === 'completed' ? 'Living Well Series done' : `Living Well Series, week ${g.les.week} of 8`}</StatusWord>}
      </div>
      <ol className="m-0 grid list-none gap-0 border-t border-line p-0 pt-1">
        {[
          { word: '48-hour check-in', done: g.care.checkIn && `Logged ${fmt(g.care.checkIn)}`, due: g.care.checkInDue && `Due ${fmt(g.care.checkInDue)}`, act: () => logCheckIn(g.id, by), label: 'Log check-in' },
          { word: 'Integration calls', done: g.care.calls ? `${g.care.calls} logged` : '', due: 'Notes go in the record; transcription follows', act: () => logCall(g.id, by), label: 'Log a call' },
          { word: 'Integration Finalization Form', done: g.care.finalized && `Completed ${fmt(g.care.finalized)}`, due: g.care.checkIn ? 'After the review call' : 'After the check-in', act: () => finalizeCare(g.id, by), label: 'Finalize', off: !g.care.checkIn },
        ].map((s) => (
          <li key={s.word} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
            <span className="grid gap-0.5">
              <span className="text-[14.5px]">{s.word}</span>
              <span className="text-[12.5px] text-dim">{s.done || s.due}</span>
            </span>
            {!(s.word !== 'Integration calls' && s.done) && !g.care.finalized && (
              <button type="button" className="pill sm" onClick={s.act} disabled={s.off}>{s.label}</button>
            )}
          </li>
        ))}
      </ol>
    </Panel>
  )
}

export default function CarePage() {
  const { guests } = useOs()
  const needs = useNeeds('care')
  const onRetreat = guests.filter((g) => g.stage === 'retreat')
  const integrating = guests.filter((g) => g.stage === 'integration')
  return (
    <div className="arrive grid items-start gap-x-8 gap-y-6" style={{ gridTemplateColumns: 'var(--layout-hub)' }}>
      <ViewHead label={<>Facilitators and Integration Guides · <ExampleNote /></>} title="Sessions and care" lead="Session notes while a guest is on retreat, then integration care: the check-in at 48 hours, the calls, and the finalization that decides what comes next." />
      <div className="grid min-w-0 content-start gap-6 @max-[900px]/frame:col-span-full">
        <section className="grid gap-4" aria-labelledby="on-h">
          <Sec id="on-h">On retreat · {onRetreat.length}</Sec>
          {onRetreat.length ? onRetreat.map((g) => <SessionNotes key={g.id} g={g} />) : <Blank>No guest is on retreat today. Guests arrive here on their retreat’s first day.</Blank>}
        </section>
        <section className="grid gap-4" aria-labelledby="int-h">
          <Sec id="int-h">Integration care · {integrating.length}</Sec>
          {integrating.length ? integrating.map((g) => <Integration key={g.id} g={g} />) : <Blank>Guests arrive here when their session is marked complete.</Blank>}
        </section>
      </div>
      <aside className="grid min-w-0 content-start gap-6 @max-[900px]/frame:col-span-full">
        <section className="grid gap-3.5" aria-labelledby="care-needs">
          <Sec id="care-needs">Needs you · {needs.length}</Sec>
          <NeedList needs={needs} empty="No check-in or notes are late." />
        </section>
        <Panel band className="gap-3 !p-6">
          <span className="flex items-center gap-2.5"><KeyRound size={15} strokeWidth={1.5} aria-hidden="true" /><span className="eyebrow ink">Access windows</span></span>
          <p className="text-[14px]/[1.6] text-dim">A facilitator sees a guest’s record from the first day of the retreat until three days after it, or until the notes are saved. Admin is alerted when notes are late.</p>
        </Panel>
      </aside>
    </div>
  )
}
