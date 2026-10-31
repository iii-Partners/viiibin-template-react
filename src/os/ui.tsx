// The parts Northlight OS's views share: a guest row, the readiness meter, a need with its one-press actions, the
// activity log, a flowchart step's type tag, the example-data note and the clock. Built from the design system's parts.
import { useState, type ReactNode } from 'react'
import { ArrowRight, Cog, FlaskConical } from 'lucide-react'
import { openScreen } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { StatusWord } from '@/components/system/status'
import { Blank } from '@/components/system/empty'
import { cn } from '@/lib/utils/cn'
import { STEPS, type StepType } from './blueprint'
import { fmt, FORMS, PROGRAMS, retreatName, STAGE, type Guest, type OsEvent } from './model'
import { INTEGRATORS } from './seed'
import { useOs } from './store'
import type { Need } from './needs'

/** Who acts from each desk in the prototype: the named staff from the documents, or the guest's own team. */
export const ACTOR = { operations: 'Mara', sales: 'Silas', clinical: 'Dr. Imani Brooks', assignment: 'Rosa' } as const

export function KindTag({ type, className }: { type: StepType; className?: string }) {
  return <span className={cn('kind', type, className)}>{type}</span>
}

export function StageWord({ g, className }: { g: Guest; className?: string }) {
  return <StatusWord st={STAGE[g.stage].st} className={className}>{STAGE[g.stage].word}</StatusWord>
}

/** Forms returned out of the checklist, as a four-cell meter and a count. */
export function Readiness({ g, className }: { g: Guest; className?: string }) {
  const today = useOs((s) => s.today)
  const forms = FORMS.map((f) => ({ ...f, x: g.forms[f.id] }))
  if (!forms.some((f) => f.x)) return null
  const done = forms.filter((f) => f.x?.done).length
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label={`${done} of ${FORMS.length} forms returned`}>
      <span className="flex gap-[3px]" aria-hidden="true">
        {forms.map((f) => (
          <i key={f.id} title={f.word} className={cn('block h-2.5 w-2.5', f.x?.done ? 'bg-text' : f.x && f.x.due < today ? 'bg-fault' : 'bg-wash ring-1 ring-edge/50 ring-inset')} />
        ))}
      </span>
      <span className="text-[12px] text-dim tabular-nums">{done}/{FORMS.length}</span>
    </span>
  )
}

/** A guest as a row that opens their record. */
export function GuestRow({ g, extra }: { g: Guest; extra?: ReactNode }) {
  const retreats = useOs((s) => s.retreats)
  const r = retreats.find((x) => x.id === (g.retreatId ?? g.hold?.retreatId))
  const sub = [g.program && PROGRAMS[g.program].word, r && `${retreatName(r)}${g.hold && !g.retreatId ? ' (held)' : g.room ? `, room ${g.room}` : ''}`].filter(Boolean).join(' · ') || `${g.channel}${g.referrer ? ` via ${g.referrer}` : ''}`
  return (
    <button
      type="button"
      data-door={`guest-${g.id}`}
      onClick={(e) => openScreen('guest', { id: g.id }, e.currentTarget)}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-5 gap-y-1 px-4 py-4 text-left transition-colors duration-(--dur-hover) hover:bg-wash focus-visible:bg-wash focus-visible:outline-none max-[560px]:grid-cols-[minmax(0,1fr)_auto]"
    >
      <span className="grid min-w-0 gap-1">
        <span className="truncate font-display text-[19px]/[1.25] font-light">{g.name}{g.returning && <span className="ml-2 align-middle text-[10.5px] tracking-[0.12em] text-dim uppercase">Returning</span>}</span>
        <span className="truncate text-[13px] text-dim">{sub}</span>
      </span>
      <span className="flex items-center gap-4 max-[560px]:col-start-1 max-[560px]:row-start-2">
        {extra ?? <Readiness g={g} />}
        <StageWord g={g} />
      </span>
      <ArrowRight className="h-4 w-4 text-dim transition-transform duration-(--dur-hover) group-hover:translate-x-1 group-hover:text-text max-[560px]:row-span-2" strokeWidth={1.4} aria-hidden="true" />
    </button>
  )
}

export function GuestList({ guests, empty, extra }: { guests: Guest[]; empty: ReactNode; extra?: (g: Guest) => ReactNode }) {
  if (!guests.length) return <Blank>{empty}</Blank>
  return (
    <ul className="panel m-0 grid list-none !p-2">
      {guests.map((g, i) => (
        <li key={g.id} className="rise-in border-t border-line first:border-t-0" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
          <GuestRow g={g} extra={extra?.(g)} />
        </li>
      ))}
    </ul>
  )
}

/** The one-press actions that clear a need, by its kind (the key's suffix). */
function NeedActions({ need, g }: { need: Need; g: Guest }) {
  const os = useOs()
  const [who, setWho] = useState(INTEGRATORS[0])
  const kind = need.key.split('-').pop()
  const open = (el: HTMLElement) => openScreen('guest', { id: g.id }, el)
  const go = (label: string, run: () => void, primary = false) => (
    <button type="button" className={cn('pill sm', primary && 'go')} onClick={run}>{label}</button>
  )
  const openBtn = (label = 'Open record') => (
    <button type="button" className="explore !text-[10.5px]" onClick={(e) => open(e.currentTarget)}>
      {label} <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
    </button>
  )
  switch (kind) {
    case 'stalled': return <>{go('Remind once more', () => os.remindApplication(g.id, ACTOR.sales))}{go('Mark lost', () => os.markLost(g.id, ACTOR.sales))}{openBtn()}</>
    case 'hold': return <>{go('Extend 14 days', () => os.extendHold(g.id, ACTOR.operations), true)}{go('Release now', () => os.releaseHold(g.id, ACTOR.operations))}</>
    case 'unpaid': return <>{go('Log a call', () => os.remindInvoice(g.id, ACTOR.operations))}{openBtn()}</>
    case 'forms': {
      const late = FORMS.filter((f) => g.forms[f.id] && !g.forms[f.id]!.done && g.forms[f.id]!.due < os.today)
      return <>{go(late.every((f) => g.forms[f.id]!.chased === os.today) ? 'Chased today' : 'Chase now', () => late.forEach((f) => os.chaseForm(g.id, f.id, ACTOR.operations)), true)}{openBtn()}</>
    }
    case 'integrator':
      return (
        <span className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`int-${g.id}`}>Integrator</label>
          <select id={`int-${g.id}`} value={who} onChange={(e) => setWho(e.target.value)} className="field !w-auto !py-2 !text-[13px]">
            {INTEGRATORS.map((n) => <option key={n}>{n}</option>)}
          </select>
          {go('Assign', () => os.assignIntegrator(g.id, who, ACTOR.assignment), true)}
        </span>
      )
    case 'complete': return <>{go('Mark complete', () => os.markComplete(g.id, ACTOR.operations), true)}{openBtn()}</>
    case 'checkin': return <>{go('Log check-in', () => os.logCheckIn(g.id, g.integrator ?? 'Integration Guide'), true)}{openBtn()}</>
    default: return openBtn(kind === 'review' ? 'Open review' : kind === 'qualify' ? 'Qualify' : kind === 'retention' ? 'Record the call' : kind === 'book' ? 'Book the session' : 'Open record')
  }
}

export function NeedCard({ need }: { need: Need }) {
  const g = useOs((s) => s.guests.find((x) => x.id === need.guestId))
  if (!g) return null
  return (
    <Panel className="gap-2.5 !p-5">
      <span className="flex items-center justify-between gap-3">
        <StatusWord st={need.st}>{need.word}</StatusWord>
        <span className="text-[10.5px] tracking-[0.12em] text-dim uppercase">{need.source}</span>
      </span>
      <b className="font-display text-[20px]/[1.25] font-light">{need.title}</b>
      <p className="text-[13.5px]/[1.55] text-dim">{need.why}</p>
      <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
        <NeedActions need={need} g={g} />
      </div>
    </Panel>
  )
}

export function NeedList({ needs, empty, limit }: { needs: Need[]; empty: string; limit?: number }) {
  const shown = limit ? needs.slice(0, limit) : needs
  if (!needs.length) return <Blank>{empty}</Blank>
  return (
    <div className="grid gap-3">
      {shown.map((n) => <NeedCard key={n.key} need={n} />)}
      {limit && needs.length > limit && <p className="text-[13px] text-dim">{needs.length - limit} more, lower in urgency.</p>}
    </div>
  )
}

/** What happened, newest first. NL-OS's own work shows with a cog and the steps it replaced today. */
export function ActivityLog({ events, limit = 8, guestNames = true }: { events: OsEvent[]; limit?: number; guestNames?: boolean }) {
  const guests = useOs((s) => s.guests)
  const shown = [...events].sort((a, b) => b.id - a.id).slice(0, limit)
  if (!shown.length) return <Blank>Nothing has happened here yet. Actions and automations land here as they run.</Blank>
  return (
    <ol className="m-0 grid list-none gap-0 p-0">
      {shown.map((e) => {
        const g = guests.find((x) => x.id === e.guestId)
        return (
          <li key={e.id} className="rise-in grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 border-t border-line py-3 first:border-t-0 first:pt-0">
            <span className={cn('mt-0.5 grid h-7 w-7 place-items-center rounded-full border', e.auto ? 'border-accent text-accent' : 'border-edge text-text')} aria-hidden="true">
              {e.auto ? <Cog size={13} strokeWidth={1.5} /> : <span className="text-[11px] font-medium">{e.actor.replace(/^Dr\. /, '').slice(0, 1)}</span>}
            </span>
            <span className="grid min-w-0 gap-1">
              <span className="text-[13.5px]/[1.5]">
                <b className="font-medium">{e.auto ? 'NL-OS' : e.actor}</b>
                {guestNames && g && (
                  <>
                    {' · '}
                    <button type="button" className="underline decoration-line underline-offset-4 hover:decoration-text" onClick={(ev) => openScreen('guest', { id: g.id }, ev.currentTarget)}>{g.name}</button>
                  </>
                )}
                <span className="text-dim"> · {fmt(e.at)}</span>
              </span>
              <span className="text-[13.5px]/[1.5] text-dim">{e.text}</span>
              {!!e.replaces?.length && (
                <span className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[10.5px] tracking-[0.12em] text-dim uppercase">Replaces</span>
                  {e.replaces.map((id) => (
                    <button key={id} type="button" title={STEPS[id]?.title} onClick={(ev) => openScreen('step', { id }, ev.currentTarget)} className="font-mono text-[11px] text-accent underline decoration-transparent underline-offset-4 hover:decoration-accent">
                      {STEPS[id]?.sf ?? id}
                    </button>
                  ))}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** The line every OS view carries: this is a prototype, on invented guests. */
export function ExampleNote() {
  return (
    <span className="inline-flex items-center gap-2 text-[10.5px] tracking-[0.14em] text-dim uppercase">
      <FlaskConical size={13} strokeWidth={1.5} aria-hidden="true" /> Prototype · example guests
    </span>
  )
}

/** The prototype's clock: today's date and the control that advances it one day, which runs the automations. */
export function Clock({ className }: { className?: string }) {
  const today = useOs((s) => s.today)
  const advance = useOs((s) => s.advanceDay)
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-3', className)}>
      <span className="eyebrow ink">{fmt(today, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
      <button type="button" className="pill sm" onClick={advance} title="Advance the prototype’s clock one day; reminders, hold expiry, chasers and check-ins run">
        Next day <ArrowRight size={13} strokeWidth={1.5} className="arr" aria-hidden="true" />
      </button>
    </span>
  )
}

/** A view's head: the tracked label, the Newsreader title, the lead sentence, and anything on the right. */
export function ViewHead({ label, title, lead, side }: { label: ReactNode; title: string; lead: ReactNode; side?: ReactNode }) {
  return (
    <div className="col-span-full grid gap-3 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <small className="eyebrow">{label}</small>
        {side}
      </div>
      <h1 className="type-display @max-[700px]/frame:text-[40px]/[1.05]">{title}</h1>
      <p className="lead max-w-[52ch] text-dim">{lead}</p>
    </div>
  )
}
