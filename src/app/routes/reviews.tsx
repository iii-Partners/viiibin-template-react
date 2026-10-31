// Medical reviews: the Medical Team's queue. Today the decision reaches admin, who tags it by hand, with no clock while
// a deal waits (insight I04). Here the reviewer decides in the app, each review shows its days waiting against the
// target, and the medical detail stays in this clinical space; operations sees only the decision and its date
// (insight I10). Approving sends the agreement and the one invoice together (the wish list; insight I03).
import { Lock } from 'lucide-react'
import { openScreen } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { Sec, StatusWord } from '@/components/system/status'
import { Blank } from '@/components/system/empty'
import { confirm } from '@/components/system/confirm'
import { daysBetween, fmt, PROGRAMS, retreatName, type Guest } from '@/os/model'
import { REVIEW_TARGET_DAYS, useOs } from '@/os/store'
import { ACTOR, ExampleNote, ViewHead } from '@/os/ui'

function Review({ g }: { g: Guest }) {
  const { today, retreats, decide } = useOs()
  const waited = daysBetween(g.medical.submitted ?? today, today)
  const late = waited > REVIEW_TARGET_DAYS
  const held = retreats.find((r) => r.id === g.hold?.retreatId)
  const notApprove = async () => {
    if (await confirm({ title: `Not approve ${g.name}?`, body: 'The room hold is released and the guest leaves the pipeline as Not approved. The decision and its date are visible to operations; the reason stays here.', action: 'Not approve', risky: true }))
      decide(g.id, 'not-approved', ACTOR.clinical)
  }
  return (
    <Panel className="gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <button type="button" className="text-left font-display text-[26px]/[1.15] font-light underline decoration-transparent underline-offset-4 hover:decoration-line" onClick={(e) => openScreen('guest', { id: g.id }, e.currentTarget)}>
            {g.name}
          </button>
          <span className="text-[13px] text-dim">
            {g.program && PROGRAMS[g.program].word}{held && ` · held on ${retreatName(held)}`} · submitted {fmt(g.medical.submitted ?? today)}
          </span>
        </div>
        {g.medical.status === 'info' ? <StatusWord st="pending">Waiting on the guest</StatusWord> : <StatusWord st={late ? 'blocked' : 'ok'}>{waited} day{waited === 1 ? '' : 's'} · target {REVIEW_TARGET_DAYS}</StatusWord>}
      </div>
      <div className="grid gap-3 border-t border-line pt-4">
        <span className="eyebrow">Application summary</span>
        <p className="text-[15px]/[1.6] font-light">{g.medical.summary}</p>
        {!!g.medical.flags?.length && (
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {g.medical.flags.map((f) => <li key={f}><StatusWord st="risk">{f}</StatusWord></li>)}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5 border-t border-line pt-4">
        <button type="button" className="pill go" onClick={() => decide(g.id, 'approved', ACTOR.clinical)} disabled={g.medical.status === 'info'}>Approve</button>
        <button type="button" className="pill" onClick={() => decide(g.id, 'info', ACTOR.clinical)} disabled={g.medical.status === 'info'}>Ask for more</button>
        <button type="button" className="pill risky" onClick={() => void notApprove()}>Not approve</button>
      </div>
    </Panel>
  )
}

export default function ReviewsPage() {
  const { today, guests } = useOs()
  const queue = guests.filter((g) => g.stage === 'review').sort((a, b) => (a.medical.submitted ?? '').localeCompare(b.medical.submitted ?? ''))
  const decided = guests.filter((g) => g.medical.decided).sort((a, b) => b.medical.decided!.localeCompare(a.medical.decided!)).slice(0, 6)
  const late = queue.filter((g) => g.medical.status === 'in-review' && daysBetween(g.medical.submitted ?? today, today) > REVIEW_TARGET_DAYS).length
  return (
    <div className="arrive grid items-start gap-x-8 gap-y-6" style={{ gridTemplateColumns: 'var(--layout-hub)' }}>
      <ViewHead
        label={<>Medical Team · <ExampleNote /></>}
        title="Medical reviews"
        lead={queue.length ? `${queue.length} application${queue.length === 1 ? '' : 's'} to decide${late ? `, ${late} past the ${REVIEW_TARGET_DAYS}-day target` : ''}. Approval sends the agreement and invoice together.` : 'No application waits for a decision.'}
      />
      <section className="grid min-w-0 content-start gap-4 @max-[900px]/frame:col-span-full" aria-labelledby="queue-h">
        <Sec id="queue-h">To decide · {queue.length}</Sec>
        {queue.length ? queue.map((g) => <Review key={g.id} g={g} />) : <Blank>New applications land here the moment a guest submits them, oldest first.</Blank>}
      </section>
      <aside className="grid min-w-0 content-start gap-6 @max-[900px]/frame:col-span-full">
        <Panel band className="gap-3 !p-6">
          <span className="flex items-center gap-2.5"><Lock size={15} strokeWidth={1.5} aria-hidden="true" /><span className="eyebrow ink">Clinical space</span></span>
          <p className="text-[14px]/[1.6] text-dim">Summaries, flags and reasons are visible to the Medical Team only. Operations and sales see the decision and its date. Where medical information may live is Discovery 2’s question; this is the prototype’s answer.</p>
        </Panel>
        <section className="grid gap-3.5" aria-labelledby="decided-h">
          <Sec id="decided-h">Recent decisions</Sec>
          <Panel className="!p-2">
            <ul className="m-0 grid list-none p-0">
              {decided.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 border-t border-line px-3 py-3 first:border-t-0">
                  <span className="grid gap-0.5">
                    <span className="text-[14.5px]">{g.name}</span>
                    <span className="text-[12.5px] text-dim">{fmt(g.medical.decided!)} · {g.medical.by}</span>
                  </span>
                  <StatusWord st={g.medical.status === 'approved' ? 'done' : 'paused'}>{g.medical.status === 'approved' ? 'Approved' : 'Not approved'}</StatusWord>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </aside>
    </div>
  )
}
