// The OS's screens, each opened over a view: a guest's record, a retreat and its manifest, a step of today's flowchart,
// an insight and a discovery session. The guest record is the one record insight I02 asks for: the journey, the next
// step with the staff action that takes it, the record, the clinical decision without its detail (insight I10), the
// rooms the guest has stayed in (the wish list), and everything that happened to them.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Lock, Printer } from 'lucide-react'
import { openScreen, useScreens } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { Chip, Sec, StatusWord } from '@/components/system/status'
import { Blank, Empty } from '@/components/system/empty'
import { Chain } from '@/components/system/charts/track'
import { confirm } from '@/components/system/confirm'
import { cn } from '@/lib/utils/cn'
import { INSIGHTS, OBSERVATIONS, OS_FOR_SECTION, QUESTIONS_TO_BRING, SCOPE_DECISIONS, SESSIONS, STEPS } from '@/os/blueprint'
import { ACTIVE_STAGES, daysBetween, fmt, FORMS, PROGRAMS, retreatName, RETREAT_WINDOW, STAGE, type Guest, type ProgramId } from '@/os/model'
import { INTEGRATORS } from '@/os/seed'
import { MAX_REMINDERS, openRetreats, useGuest, useOs, useRetreat } from '@/os/store'
import { ACTOR, ActivityLog, KindTag } from '@/os/ui'
import { RoomGrid } from '@/app/routes/retreats'

const money = (n?: number) => (n ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const Facts = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 text-[13.5px]">
    {rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => (
      <div key={k} className="contents"><dt className="text-dim">{k}</dt><dd className="text-right">{v}</dd></div>
    ))}
  </dl>
)

/* ---------- Guest ---------- */


function RetreatPicker({ value, onChange, id }: { value: string; onChange(v: string): void; id: string }) {
  const os = useOs()
  const list = openRetreats(os)
  return (
    <div>
      <label htmlFor={id} className="label">Retreat</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field">
        {list.map((r) => <option key={r.id} value={r.id}>{retreatName(r)} · {fmt(r.start)}</option>)}
      </select>
    </div>
  )
}

function NextStep({ g }: { g: Guest }) {
  const os = useOs()
  const navigate = useNavigate()
  const open = openRetreats(os)
  const [program, setProgram] = useState<ProgramId>('one-off')
  const [retreat, setRetreat] = useState(open[0]?.id ?? '')
  const [who, setWho] = useState(INTEGRATORS[0])
  const r = os.retreats.find((x) => x.id === (g.retreatId ?? g.hold?.retreatId))
  const title = (t: string) => <b className="font-display text-[24px]/[1.2] font-light">{t}</b>
  switch (g.stage) {
    case 'inquiry':
      return (
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (retreat) os.qualify(g.id, program, retreat, ACTOR.sales) }}>
          {title('Qualify the inquiry')}
          <p className="text-[14px]/[1.6] text-dim">The program sets the price from the rules; qualifying sends the application and holds a room that NL-OS releases on its own if nothing happens.</p>
          <div>
            <label htmlFor="q-program" className="label">Program</label>
            <select id="q-program" value={program} onChange={(e) => setProgram(e.target.value as ProgramId)} className="field">
              {Object.entries(PROGRAMS).map(([k, p]) => <option key={k} value={k}>{p.word} · {money(p.price)}</option>)}
            </select>
          </div>
          <RetreatPicker id="q-retreat" value={retreat} onChange={setRetreat} />
          <button type="submit" className="pill go w-fit" disabled={!retreat}>Qualify and send the application</button>
        </form>
      )
    case 'application':
      return (
        <div className="grid gap-4">
          {title('Waiting on the application')}
          <Facts rows={[['Sent', fmt(g.application.sent!)], ['Reminders', `${g.application.reminders} of ${MAX_REMINDERS}`], ['Room held', g.hold && r ? `${retreatName(r)} until ${fmt(g.hold.expires)}` : 'No hold']]} />
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="pill sm" onClick={() => os.remindApplication(g.id, ACTOR.sales)}>Remind personally</button>
            {g.hold && <button type="button" className="pill sm" onClick={() => os.extendHold(g.id, ACTOR.operations)}>Extend hold</button>}
            <button type="button" className="pill sm risky" onClick={async () => { if (await confirm({ title: `Mark ${g.name} lost?`, body: 'NL-OS releases the room hold and stops the reminders. The record stays, under Left.', action: 'Mark lost', risky: true })) os.markLost(g.id, ACTOR.sales) }}>Mark lost</button>
          </div>
        </div>
      )
    case 'review':
      return (
        <div className="grid gap-4">
          {title(g.medical.status === 'info' ? 'The Medical Team asked the guest for more' : 'With the Medical Team')}
          <p className="text-[14px]/[1.6] text-dim">Submitted {fmt(g.medical.submitted!)}, {daysBetween(g.medical.submitted!, os.today)} days ago. Operations sees the decision when it is made.</p>
          <button type="button" className="pill sm w-fit" onClick={() => { useScreens.getState().closeAll(); navigate('/app/reviews') }}>Open Medical reviews</button>
        </div>
      )
    case 'agreement':
      return (
        <div className="grid gap-4">
          {title('Agreement and payment')}
          <Facts rows={[['Agreement', g.agreement.signed ? `Signed ${fmt(g.agreement.signed)}` : `Sent ${fmt(g.agreement.sent!)}`], ['Invoice', g.invoice && `${g.invoice.number} · ${money(g.invoice.amount)}`], ['Paid', g.invoice?.paid ? fmt(g.invoice.paid) : `Not yet · ${g.invoice?.reminders ?? 0} reminders`], ['Integrator', g.integrator ?? 'Not assigned']]} />
          <p className="text-[13.5px]/[1.55] text-dim">The guest signs and pays in their portal. When both are done, the hold becomes a room and the readiness checklist starts.</p>
          <button type="button" className="pill sm w-fit" onClick={() => os.remindInvoice(g.id, ACTOR.operations)}>Log a call about payment</button>
        </div>
      )
    case 'preparing':
      return (
        <div className="grid gap-4">
          {title(`Preparing for ${r ? fmt(r.start) : 'the retreat'}`)}
          <ul className="m-0 grid list-none gap-0 p-0">
            {FORMS.map((f) => {
              const x = g.forms[f.id]
              const late = x && !x.done && x.due < os.today
              return (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0">
                  <span className="grid gap-0.5"><span className="text-[14px]">{f.word}</span><span className={cn('text-[12px]', late ? 'text-fault' : 'text-dim')}>{x?.done ? `Returned ${fmt(x.done)}` : x ? `Due ${fmt(x.due)}${x.chased ? ` · chased ${fmt(x.chased)}` : ''}` : ''}</span></span>
                  {x && !x.done && <button type="button" className="pill sm" onClick={() => os.chaseForm(g.id, f.id, ACTOR.operations)} disabled={x.chased === os.today}>{x.chased === os.today ? 'Chased' : 'Chase'}</button>}
                </li>
              )
            })}
          </ul>
          {!g.integrator && (
            <div className="flex flex-wrap items-end gap-2.5 border-t border-line pt-4">
              <div className="min-w-[180px] flex-1"><label htmlFor="g-int" className="label">Integrator</label><select id="g-int" value={who} onChange={(e) => setWho(e.target.value)} className="field">{INTEGRATORS.map((n) => <option key={n}>{n}</option>)}</select></div>
              <button type="button" className="pill go" onClick={() => os.assignIntegrator(g.id, who, ACTOR.assignment)}>Assign</button>
            </div>
          )}
        </div>
      )
    case 'retreat':
      return (
        <div className="grid gap-4">
          {title(r ? `On ${retreatName(r)}, room ${g.room}` : 'On retreat')}
          <p className="text-[14px]/[1.6] text-dim">{g.session?.notes ? `Notes in from ${g.session.notesBy}.` : `${r?.facilitator ?? 'The facilitator'} writes session notes in Sessions and care.`}</p>
          {g.session?.notes && r && r.end <= os.today && <button type="button" className="pill go w-fit" onClick={() => os.markComplete(g.id, ACTOR.operations)}>Mark complete</button>}
        </div>
      )
    case 'integration': {
      const left = g.program ? PROGRAMS[g.program].sessions - g.sessionsUsed : 0
      return (
        <div className="grid gap-4">
          {title('Integration care')}
          <Facts rows={[['Check-in', g.care.checkIn ? fmt(g.care.checkIn) : g.care.checkInDue && `Due ${fmt(g.care.checkInDue)}`], ['Calls', String(g.care.calls)], ['Finalized', g.care.finalized ? fmt(g.care.finalized) : 'Not yet'], ['Package', g.program === 'package-4' ? `${g.sessionsUsed} of 4 sessions used` : 'One-off']]} />
          {g.care.finalized && left > 0 && (
            <form className="grid gap-3 border-t border-line pt-4" onSubmit={(e) => { e.preventDefault(); if (retreat) os.bookNext(g.id, retreat, ACTOR.operations) }}>
              <RetreatPicker id="g-next" value={retreat} onChange={setRetreat} />
              <button type="submit" className="pill go w-fit" disabled={!retreat}>Book the next package session</button>
            </form>
          )}
        </div>
      )
    }
    case 'retention':
      return (
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (retreat) os.retain(g.id, retreat, ACTOR.sales) }}>
          {title(`Retention call · due ${fmt(g.retention!.callDue)}`)}
          <p className="text-[14px]/[1.6] text-dim">Silas calls seven days after the last session. Record what the guest decided.</p>
          <RetreatPicker id="g-ret" value={retreat} onChange={setRetreat} />
          <div className="flex flex-wrap gap-2.5">
            <button type="submit" className="pill go" disabled={!retreat}>Continues: hold this retreat</button>
            <button type="button" className="pill risky" onClick={() => os.stop(g.id, ACTOR.sales)}>Stops for now</button>
          </div>
        </form>
      )
    default:
      return <div className="grid gap-2">{title(STAGE[g.stage].word)}<p className="text-[14px]/[1.6] text-dim">Left the journey on {fmt(g.since)}. The record stays; today this sits in {STAGE[g.stage].today}.</p></div>
  }
}

export function GuestScreen({ id }: { id: string }) {
  const g = useGuest(id)
  const { events, retreats } = useOs()
  if (!g) return <Empty icon={Lock} title="This guest is no longer here">The example data was reset. Close this screen to go back.</Empty>
  const at = ACTIVE_STAGES.findIndex((s) => s.id === g.stage)
  return (
    <>
      <Panel className="gap-2">
        <span className="eyebrow ink">The journey</span>
        <Chain label="Where the guest is in the journey" steps={ACTIVE_STAGES.map((s, i) => ({ title: s.word, tone: at < 0 ? '' : i < at ? 'done' : i === at ? 'lit' : '' }))} />
      </Panel>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'var(--layout-plates)' }}>
        <Panel band className="content-start gap-3"><span className="eyebrow ink">Next step · {STAGE[g.stage].owner}</span><NextStep g={g} /></Panel>
        <Panel className="content-start gap-4">
          <Sec as="h3">Record</Sec>
          <Facts rows={[
            ['Greeting', g.greeting], ['Email', g.email], ['Home', g.home], ['Came through', g.channel], ['Referred by', g.referrer],
            ['Program', g.program && `${PROGRAMS[g.program].word} · ${money(g.price)}`], ['Returning', g.returning ? 'Yes' : 'No'],
            ['In this stage since', fmt(g.since)], ['Today this is', STAGE[g.stage].today],
          ]} />
        </Panel>
        <Panel className="content-start gap-4">
          <span className="flex items-center gap-2.5"><Lock size={14} strokeWidth={1.5} aria-hidden="true" /><Sec as="h3" className="flex-1">Clinical</Sec></span>
          <Facts rows={[['Medical decision', g.medical.status === 'approved' ? 'Approved' : g.medical.status === 'not-approved' ? 'Not approved' : g.medical.status === 'none' ? 'Not yet applied' : 'In review'], ['Decided', g.medical.decided && `${fmt(g.medical.decided)} · ${g.medical.by}`], ['Integrator', g.integrator]]} />
          <p className="text-[13px]/[1.55] text-dim">The application summary, flags and session notes are visible to the Medical Team, the guest’s facilitator during the access window, and their Integration Guide.</p>
        </Panel>
        <Panel className="content-start gap-3">
          <Sec as="h3">Stays</Sec>
          {g.stays.length ? g.stays.map((s, i) => {
            const r = retreats.find((x) => x.id === s.retreatId)
            return <span key={i} className="flex justify-between gap-3 text-[13.5px]"><span>{r ? retreatName(r) : `Retreat ${s.retreatId}`}</span><span className="text-dim">Room {s.room}{r ? ` · ${fmt(r.start)}` : ''}</span></span>
          }) : <Blank>Rooms the guest stays in appear here, without opening facilitator notes.</Blank>}
        </Panel>
      </div>
      <section className="grid gap-3" aria-labelledby="g-log">
        <Sec id="g-log">What happened</Sec>
        <Panel className="!p-5"><ActivityLog events={events.filter((e) => e.guestId === g.id)} limit={20} guestNames={false} /></Panel>
      </section>
    </>
  )
}

/* ---------- Retreat ---------- */


export function RetreatScreen({ id }: { id: string }) {
  const r = useRetreat(id)
  const { today, guests } = useOs()
  if (!r) return <Empty icon={Lock} title="This retreat is not in the example data" />
  const booked = guests.filter((g) => g.retreatId === r.id && !['inactive', 'not-approved', 'lost'].includes(g.stage)).sort((a, b) => (a.room ?? 0) - (b.room ?? 0))
  const held = guests.filter((g) => g.hold?.retreatId === r.id && !g.retreatId)
  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Panel className="content-start gap-4">
          <Facts rows={[['Window', RETREAT_WINDOW[r.version]], ['Site', `${r.site} · ${r.rooms} rooms`], ['Facilitator', r.facilitator], ['Booked', `${booked.length} of ${r.rooms}`], ['Held', held.length ? held.map((g) => g.name).join(', ') : 'None'], ['Starts', daysBetween(today, r.start) > 0 ? `In ${daysBetween(today, r.start)} days` : fmt(r.start)]]} />
          <RoomGrid r={r} guests={guests} today={today} />
        </Panel>
        <Panel className="content-start gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Sec as="h3" className="flex-1">Manifest · one sheet per retreat</Sec>
            <button type="button" className="pill sm" onClick={() => window.print()}><Printer size={13} strokeWidth={1.5} aria-hidden="true" /> Print</button>
          </div>
          {booked.length ? (
            <ul className="m-0 grid list-none p-0">
              {booked.map((g) => {
                const late = FORMS.filter((f) => g.forms[f.id] && !g.forms[f.id]!.done && g.forms[f.id]!.due < today)
                return (
                  <li key={g.id} className="border-t border-line first:border-t-0">
                    <button type="button" onClick={(e) => openScreen('guest', { id: g.id }, e.currentTarget)} className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-4 py-3 text-left hover:bg-wash focus-visible:bg-wash focus-visible:outline-none">
                      <span className="figure text-center text-[22px]">{g.room}</span>
                      <span className="grid min-w-0 gap-0.5">
                        <span className="text-[14.5px]">{g.name}{g.returning ? ' · returning' : ''}</span>
                        <span className="truncate text-[12.5px] text-dim">{g.home} · integrator {g.integrator ?? 'not assigned'} · {FORMS.filter((f) => g.forms[f.id]?.done).length}/{FORMS.length} forms</span>
                      </span>
                      {late.length ? <StatusWord st="blocked">{late.length} overdue</StatusWord> : <StatusWord st="ok">Ready</StatusWord>}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : <Blank>Rooms fill as guests sign and pay. Held rooms show on the grid as dashed squares.</Blank>}
          <p className="border-t border-line pt-3 text-[12.5px]/[1.5] text-dim">Intake and medical notes join this sheet for the Medical Team and the facilitator only.</p>
        </Panel>
      </div>
    </>
  )
}

/* ---------- Flowchart step ---------- */


const Jump = ({ ids, label }: { ids: string[]; label: string }) =>
  ids.length ? (
    <div className="grid gap-1.5">
      <span className="eyebrow">{label}</span>
      {ids.map((id) => (
        <button key={id} type="button" className="explore w-fit !normal-case !tracking-normal !text-[13.5px]" onClick={(e) => openScreen('step', { id }, e.currentTarget)}>
          <code className="font-mono text-[11px] text-dim">{id}</code> {STEPS[id].title} <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ))}
    </div>
  ) : null

export function StepScreen({ id }: { id: string }) {
  const s = STEPS[id]
  const events = useOs((st) => st.events)
  if (!s) return <Empty icon={Lock} title="This step is not in the flowchart" />
  const taken = events.filter((e) => e.replaces?.includes(id))
  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel className="content-start gap-4">
          <span className="flex flex-wrap items-center gap-3"><KindTag type={s.type} />{s.sf && <code className="font-mono text-[12px] text-accent">{s.sf}</code>}</span>
          <p className="text-[17px]/[1.6] font-light">{s.detail}</p>
          <Facts rows={[['Who', s.who.join(', ') || 'Nobody: it runs on its own'], ['Systems', s.sys.join(' · ')], ['Forms', s.forms.join(', ')], ['SOP chapter', s.sop.replace('ch', '0')]]} />
          {!!s.changes.length && (
            <div className="grid gap-1.5 border-t border-line pt-3"><span className="eyebrow">What it changes</span>{s.changes.map((c) => <span key={c} className="font-mono text-[12.5px]">{c}</span>)}</div>
          )}
          {s.note && <div className="grid gap-1.5 border-t border-line pt-3"><StatusWord st="risk">Note</StatusWord><p className="text-[14px]/[1.6]">{s.note}</p></div>}
        </Panel>
        <div className="grid gap-4">
          <Panel band className="content-start gap-2"><span className="eyebrow ink">In NL-OS · a proposal</span><p className="text-[14.5px]/[1.6]">{OS_FOR_SECTION[s.section]}</p></Panel>
          {!!s.ins.length && (
            <Panel className="content-start gap-2">
              <span className="eyebrow">Insights</span>
              {s.ins.map((i) => { const ins = INSIGHTS.find((x) => x.id === i)!; return <button key={i} type="button" className="explore w-fit !normal-case !tracking-normal !text-[13.5px]" onClick={(e) => openScreen('insight', { id: i }, e.currentTarget)}><code className="font-mono text-[11px] text-dim">{i}</code> {ins.title}</button> })}
              {!!s.wish.length && <span className="pt-2 text-[13px] text-dim">Wish list: {s.wish.join('; ')}</span>}
            </Panel>
          )}
          <Panel className="content-start gap-4"><Jump ids={s.prev} label="Before" /><Jump ids={s.next} label="After" /><Jump ids={s.rel} label="Related" /></Panel>
        </div>
      </div>
      <section className="grid gap-3" aria-labelledby="s-taken">
        <Sec id="s-taken">Taken over in this session · {taken.length}</Sec>
        <Panel className="!p-5"><ActivityLog events={taken} limit={10} /></Panel>
      </section>
    </>
  )
}

/* ---------- Insight ---------- */


export function InsightScreen({ id }: { id: string }) {
  const ins = INSIGHTS.find((x) => x.id === id)
  if (!ins) return <Empty icon={Lock} title="This insight is not in the documents" />
  const steps = Object.keys(STEPS).filter((k) => STEPS[k].ins.includes(ins.id))
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel className="content-start gap-4">
        <Chip st="risk">{ins.kind}</Chip>
        {ins.body.length > 1 ? <ul className="m-0 grid list-disc gap-2 pl-5">{ins.body.map((b) => <li key={b} className="text-[16px]/[1.6] font-light">{b}</li>)}</ul> : <p className="text-[17px]/[1.6] font-light">{ins.body[0]}</p>}
        <span className="text-[12.5px] text-dim">Seen in: {ins.refs.join(' · ')}</span>
      </Panel>
      <div className="grid gap-4">
        <Panel band className="content-start gap-2"><span className="eyebrow ink">In this prototype</span><p className="text-[14.5px]/[1.6]">{ins.answer}</p></Panel>
        <Panel className="content-start gap-4"><Jump ids={steps} label={`Steps it touches · ${steps.length}`} /></Panel>
      </div>
    </div>
  )
}

/* ---------- Discovery session ---------- */


export function SessionScreen({ n }: { n: number }) {
  const s = SESSIONS.find((x) => x.n === n)
  if (!s) return <Empty icon={Lock} title="This session is not in the guide" />
  const decisions = SCOPE_DECISIONS.filter((d) => d.session === n)
  const obs = OBSERVATIONS.filter((o) => o.session === n)
  const bring = QUESTIONS_TO_BRING.filter((q) => q.sessions.includes(n))
  return (
    <>
      {s.goal && <p className="lead max-w-[60ch] text-dim"><b className="font-normal text-text">Session goal.</b> {s.goal}</p>}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          {s.questions.length ? s.questions.map((q, i) => (
            <Panel key={q.q} className="gap-3">
              <span className="eyebrow">Q{i + 1}</span>
              <b className="font-display text-[22px]/[1.3] font-light">{q.q}</b>
              <ul className="m-0 grid list-disc gap-1 pl-5 text-[14px]/[1.55] text-dim">{q.probes.map((p) => <li key={p}>{p}</li>)}</ul>
            </Panel>
          )) : <Blank>{s.state === 'held' ? 'Discovery 1 is held. This guide picks up from its findings.' : 'This session remains to be defined separately.'}</Blank>}
        </div>
        <div className="grid gap-4">
          {!!s.deliverables.length && (
            <Panel band className="content-start gap-3"><span className="eyebrow ink">Deliverables · {s.deliverables.length}</span><div className="flex flex-wrap gap-2">{s.deliverables.map((d) => <span key={d} className="border border-line bg-panel px-2.5 py-1.5 text-[13px]">{d}</span>)}</div></Panel>
          )}
          {decisions.map((d) => <Panel key={d.title} className="gap-2 !p-5"><StatusWord st="pending">{d.kind}</StatusWord><b className="font-display text-[19px]/[1.25] font-light">{d.title}</b><p className="text-[13.5px]/[1.55] text-dim">{d.body}</p></Panel>)}
          {obs.map((o) => <Panel key={o.title} className="gap-2 !p-5"><StatusWord st="risk">{o.kind}</StatusWord><b className="font-display text-[19px]/[1.25] font-light">{o.title}</b><p className="text-[13.5px]/[1.55] text-dim">{o.body}</p></Panel>)}
          {!!bring.length && <Panel className="content-start gap-2"><span className="eyebrow">Questions to bring</span>{bring.map((q) => <p key={q.q} className="text-[14px]/[1.5]">{q.q}</p>)}</Panel>}
        </div>
      </div>
    </>
  )
}
