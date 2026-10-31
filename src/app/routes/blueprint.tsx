// The Blueprint: the two discovery documents as data, tied to the OS. Five sections: the flow as it runs today (59
// steps in nine lanes, each with what NL-OS does instead, and which of today's steps the OS has already taken over in
// this session's activity log), the ten intake insights, the systems today, the NL-OS target, and the discovery plan.
// Every step, insight and session opens as a screen.
import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { openScreen } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { Chip, Sec, StatusWord, type Status } from '@/components/system/status'
import { ReelTrack } from '@/components/system/charts/reel'
import { Bars } from '@/components/system/charts/bars'
import { Chain } from '@/components/system/charts/track'
import { cn } from '@/lib/utils/cn'
import {
  APPROACH, CHAPTERS, COMMS, CVOS, FORM_STEPS, INSIGHTS, INTAKE_FIGURES, OBJECTIVES, OBSERVATIONS, OS_FOR_SECTION, OVERVIEW, PABAU,
  QUESTIONS_TO_BRING, SALESMATE_EXTRAS, SCOPE_DECISIONS, SECTIONS, SESSIONS, SOURCES, STACK, STAGE_STEPS, STEPS, STEP_TYPES, WISHES,
} from '@/os/blueprint'
import { useOs } from '@/os/store'
import { KindTag, ViewHead } from '@/os/ui'

const TABS = [
  { id: 'flow', word: 'Flow today' },
  { id: 'insights', word: 'Insights' },
  { id: 'systems', word: 'Systems today' },
  { id: 'cvos', word: 'NL-OS target' },
  { id: 'discovery', word: 'Discovery' },
] as const
type Tab = (typeof TABS)[number]['id']

const StepLink = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) => (
  <button type="button" data-door={`step-${id}`} onClick={(e) => openScreen('step', { id }, e.currentTarget)} className={className}>{children}</button>
)

function Flow() {
  const events = useOs((s) => s.events)
  const absorbed = useMemo(() => new Set(events.flatMap((e) => e.replaces ?? [])), [events])
  const w = OVERVIEW.workload
  return (
    <div className="grid gap-6">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {OVERVIEW.stats.map((s) => (
          <Panel key={s.label} className="gap-1.5 !p-5">
            <b className="figure text-[44px]/none">{s.n}</b>
            <span className="text-[14px]">{s.label}</span>
            <span className="text-[12.5px] text-dim">{s.note}</span>
          </Panel>
        ))}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ReelTrack code="WKL" big={w.total} label="Tagged SOP steps" meta="By action type, across all 7 chapters" segs={[{ label: 'Manual', n: w.manual, st: 'ink' }, { label: 'Automated', n: w.auto, st: 'accent' }, { label: 'Pipeline move', n: w.pipeline, st: 'quiet' }]} empty={w.note} />
        <Panel className="gap-3">
          <span className="eyebrow ink">Steps by chapter</span>
          <Bars label="Tagged SOP steps by chapter" max={20} rows={CHAPTERS.map((c) => ({ name: `${c.code} ${c.name}`, v: c.steps, label: String(c.steps) }))} />
          <p className="text-[12.5px]/[1.5] text-dim">{w.note}</p>
        </Panel>
      </div>
      <Panel band className="grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-1 !p-6">
        <b className="figure row-span-2 text-[56px]/none">{absorbed.size}</b>
        <span className="eyebrow ink">of {Object.keys(STEPS).length} flowchart steps taken over</span>
        <span className="text-[14px]/[1.55] text-dim">by NL-OS or done once in the guest record in this session’s activity log. Act in the other views and this count rises; each step below shows when it has been.</span>
      </Panel>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {STEP_TYPES.map((t) => <span key={t.id} className="flex items-center gap-2"><KindTag type={t.id} /><span className="text-[12.5px] text-dim">{t.note}</span></span>)}
      </div>
      {SECTIONS.map((sec) => (
        <section key={sec.name} className="grid gap-3" aria-label={sec.name}>
          <Sec>{sec.name}</Sec>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <ol className="panel m-0 grid list-none !p-2">
              {sec.steps.map((id) => {
                const s = STEPS[id]
                return (
                  <li key={id} className="border-t border-line first:border-t-0">
                    <StepLink id={id} className="group grid w-full grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-3 text-left transition-colors duration-(--dur-hover) hover:bg-wash focus-visible:bg-wash focus-visible:outline-none max-[560px]:grid-cols-[minmax(0,1fr)_auto]">
                      <KindTag type={s.type} className="max-[560px]:hidden" />
                      <span className="grid min-w-0 gap-0.5">
                        <span className="text-[14px]/[1.4]">{s.title}</span>
                        <span className="truncate text-[12px] text-dim">{[s.sf, s.who.join(', '), s.sys.join(' · ')].filter(Boolean).join(' — ') || '—'}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        {absorbed.has(id) && <StatusWord st="done" className="!text-[11.5px]">Taken over</StatusWord>}
                        {s.note && <span className="text-[11px] tracking-[0.1em] text-watch uppercase" title={s.note}>Note</span>}
                        <ArrowRight size={14} strokeWidth={1.4} className="text-dim transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </StepLink>
                  </li>
                )
              })}
            </ol>
            <Panel band className="gap-2 !p-5">
              <span className="eyebrow ink">In NL-OS · a proposal</span>
              <p className="text-[14.5px]/[1.6]">{OS_FOR_SECTION[sec.name]}</p>
            </Panel>
          </div>
        </section>
      ))}
      <section className="grid gap-3" aria-labelledby="comms-h">
        <Sec id="comms-h">Client communications timeline</Sec>
        <p className="max-w-[72ch] text-[14px]/[1.6] text-dim">Every client message relative to the session. All communications go through the PipeCRM Inbox with pre-made templates; Gmail templates are deprecated.</p>
        <Panel className="!p-2">
          <ol className="m-0 grid list-none p-0">
            {COMMS.map((c, i) => (
              <li key={i} className="grid grid-cols-[100px_90px_minmax(0,1fr)_auto] items-center gap-x-4 border-t border-line px-3 py-3 first:border-t-0 max-[560px]:grid-cols-[80px_minmax(0,1fr)]">
                <span className="figure text-[17px]">{c.when}</span>
                <KindTag type={c.type} className="max-[560px]:hidden" />
                <span className="text-[14px]/[1.45]">{c.text}</span>
                <code className="font-mono text-[11px] text-dim max-[560px]:hidden">{c.sf}</code>
              </li>
            ))}
          </ol>
        </Panel>
      </section>
    </div>
  )
}

const INSIGHT_ST: Record<string, Status> = { 'Front door': 'pending', 'Duplicate entry': 'risk', Conflict: 'blocked', Bottleneck: 'blocked', Gap: 'risk', 'Data model': 'risk', Pricing: 'pending', Readiness: 'risk', Compliance: 'blocked' }

function Insights() {
  return (
    <div className="grid gap-6">
      <p className="max-w-[72ch] text-[15px]/[1.6] text-dim">Intake here means everything from referral to ready to attend: chapters 1–4 plus the pre-arrival forms. These are iii.partners’ observations across the five documents, for discussion in discovery.</p>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {INTAKE_FIGURES.map((f) => (
          <Panel key={f.label} className="gap-1.5 !p-5"><b className="figure text-[40px]/none">{f.figure}</b><span className="text-[13.5px] text-dim">{f.label}</span></Panel>
        ))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'var(--layout-plates)' }}>
        {INSIGHTS.map((ins) => (
          <Panel key={ins.id} as="button" type="button" live data-door={`insight-${ins.id}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => openScreen('insight', { id: ins.id }, e.currentTarget)} className="content-start gap-3">
            <span className="flex items-center justify-between gap-3"><Chip st={INSIGHT_ST[ins.kind]}>{ins.kind}</Chip><code className="font-mono text-[11.5px] text-dim">{ins.id}</code></span>
            <span className="font-display text-[22px]/[1.2] font-light">{ins.title}</span>
            <span className="text-[13.5px]/[1.55] text-dim">{ins.answer}</span>
          </Panel>
        ))}
      </div>
      <section className="grid gap-3" aria-labelledby="bring-h">
        <Sec id="bring-h">Questions to bring to discovery</Sec>
        <Panel className="!p-2">
          <ul className="m-0 grid list-none p-0">
            {QUESTIONS_TO_BRING.map((q) => (
              <li key={q.q} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-3 first:border-t-0">
                <span className="text-[14.5px]">{q.q}</span>
                <span className="flex gap-2">{q.sessions.map((n) => <button key={n} type="button" className="explore !text-[10.5px]" onClick={(e) => openScreen('session', { n }, e.currentTarget)}>Discovery {n}/6</button>)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </div>
  )
}

function Systems() {
  const pipelines = Object.keys(STAGE_STEPS).reduce<Record<string, string[]>>((m, k) => { const [p, s] = k.split('|'); (m[p] ??= []).push(s); return m }, {})
  return (
    <div className="grid gap-6">
      <p className="max-w-[72ch] text-[15px]/[1.6] text-dim">The Technology Layout diagrams, as data: how PipeCRM, CareDesk and FormKit are structured today, and which flowchart steps use each pipeline stage and form.</p>
      <section className="grid gap-3"><Sec>PipeCRM · 4 pipelines, 24 stages</Sec>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {Object.entries(pipelines).map(([p, stages]) => (
            <Panel key={p} className="content-start gap-3">
              <span className="eyebrow ink">{p} pipeline</span>
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {stages.map((s) => {
                  const used = STAGE_STEPS[`${p}|${s}`]
                  return (
                    <li key={s} className="flex items-center justify-between gap-2 text-[13.5px]">
                      <span className={cn(!used.length && 'text-dim')}>{s}</span>
                      <span className="flex gap-1.5">{used.map((id) => <StepLink key={id} id={id} className="font-mono text-[11px] text-accent underline decoration-transparent underline-offset-4 hover:decoration-accent">{id}</StepLink>)}</span>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          ))}
          <Panel className="content-start gap-3">
            <span className="eyebrow ink">PipeCRM outreach and reporting</span>
            {SALESMATE_EXTRAS.map((x) => <span key={x.name} className="flex items-baseline justify-between gap-3 text-[13.5px]"><span>{x.name}</span><b className="figure text-[20px]">{x.n}</b></span>)}
          </Panel>
        </div>
      </section>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="grid gap-3"><Sec>CareDesk</Sec>
          <Panel className="gap-3"><p className="text-[14px]/[1.6] text-dim">{PABAU.summary}</p><ul className="m-0 grid list-none gap-1.5 p-0">{PABAU.holds.map((h) => <li key={h} className="text-[13.5px]">{h}</li>)}</ul></Panel>
        </section>
        <section className="grid gap-3"><Sec>FormKit</Sec>
          <Panel className="gap-2">
            {Object.entries(FORM_STEPS).map(([f, ids]) => (
              <span key={f} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span>{f}</span>
                <span className="flex gap-1.5">{ids.length ? ids.map((id) => <StepLink key={id} id={id} className="font-mono text-[11px] text-accent">{id}</StepLink>) : <span className="text-[12px] text-dim">sent by automation flows</span>}</span>
              </span>
            ))}
            <p className="pt-2 text-[12.5px] text-dim">Plus a long list of client agreement and internal-use forms.</p>
          </Panel>
        </section>
      </div>
      <section className="grid gap-3"><Sec>Technology stack · {STACK.length} tools</Sec>
        <div className="flex flex-wrap gap-2">{STACK.map((t, i) => <span key={t} className="border border-line bg-panel px-3 py-2 text-[13px]"><span className="mr-2 font-mono text-[11px] text-dim">{String(i + 1).padStart(2, '0')}</span>{t}</span>)}</div>
      </section>
    </div>
  )
}

function Cvos() {
  return (
    <div className="grid gap-6">
      <p className="max-w-[72ch] text-[15px]/[1.6] text-dim">{CVOS.summary} The FRS (v5.0) is the client’s specification; Discovery keeps system retirement provisional and puts the retreat board first.</p>
      <section className="grid gap-3"><Sec>Vendors to consolidate · 12</Sec>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {CVOS.vendors.map((v) => (
            <Panel key={v.name} className="content-start gap-2 !p-5">
              <span className="flex items-baseline justify-between gap-2"><span className="font-display text-[20px] font-light">{v.name}</span><code className="font-mono text-[11px] text-dim">{v.module}</code></span>
              <span className="text-[13px]/[1.5] text-dim">{v.role}</span>
              <StatusWord st={v.onStack ? 'ok' : 'paused'} className="!text-[11.5px]">{v.onStack ? 'On today’s stack list' : 'Not on the stack list'}</StatusWord>
            </Panel>
          ))}
        </div>
      </section>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel className="content-start gap-3"><span className="eyebrow ink">Strategic goals</span>{CVOS.goals.map(([k, v]) => <p key={k} className="text-[14px]/[1.55]"><b className="font-medium">{k}.</b> <span className="text-dim">{v}</span></p>)}</Panel>
        <Panel className="content-start gap-3"><span className="eyebrow ink">Security and compliance</span><ul className="m-0 grid list-none gap-1.5 p-0">{CVOS.security.map((x) => <li key={x} className="text-[14px]">{x}</li>)}</ul></Panel>
        <Panel className="content-start gap-3"><span className="eyebrow ink">Explicitly out of scope</span><ul className="m-0 grid list-none gap-1.5 p-0">{CVOS.outOfScope.map((x) => <li key={x} className="text-[14px]">{x}</li>)}</ul></Panel>
        <Panel className="content-start gap-3"><span className="eyebrow ink">Access model</span><ul className="m-0 grid list-none gap-1.5 p-0">{CVOS.access.map((x) => <li key={x} className="text-[14px]">{x}</li>)}</ul></Panel>
      </div>
      <section className="grid gap-3"><Sec>Wish list from the team · FRS §15</Sec>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'var(--layout-plates)' }}>
          {WISHES.map((w) => (
            <Panel key={w.title} className="content-start gap-2 !p-5">
              <span className="font-display text-[20px]/[1.2] font-light">{w.title}</span>
              <span className="text-[13.5px]/[1.55] text-dim">{w.body} {w.replaces}</span>
              <span className="pt-1 text-[11px] tracking-[0.12em] text-accent uppercase">In this prototype: {w.where}</span>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  )
}

function Discovery() {
  const tone = (s: (typeof SESSIONS)[number]['state']) => (s === 'held' ? 'done' : s === 'next' ? 'lit' : '') as 'done' | 'lit' | ''
  return (
    <div className="grid gap-6">
      <p className="max-w-[72ch] text-[15px]/[1.6] text-dim">6 sessions: 1 held, 4 in this guide, 1 to be defined. They define the AI-native operating platform Northlight needs, with process improvements, integration boundaries, phased delivery priorities and measurable acceptance criteria.</p>
      <Panel className="gap-3">
        <span className="eyebrow ink">Discovery path · 1 of 6 held</span>
        <Chain label="Discovery path" steps={SESSIONS.map((s) => ({ title: `${s.n}/6 ${s.short}`, tone: tone(s.state) }))} />
      </Panel>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {SESSIONS.filter((s) => s.questions.length).map((s) => (
          <Panel key={s.n} as="button" type="button" live data-door={`session-${s.n}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => openScreen('session', { n: s.n }, e.currentTarget)} className="content-start gap-2 !p-5">
            <span className="eyebrow">Discovery {s.n}/6{s.state === 'next' ? ' · up next' : ''}</span>
            <span className="font-display text-[22px]/[1.2] font-light">{s.name}</span>
            <span className="text-[13px] text-dim">{s.questions.length} questions · {s.deliverables.length} deliverables</span>
          </Panel>
        ))}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="grid gap-3"><Sec>Needs a decision · {SCOPE_DECISIONS.length}</Sec>
          {SCOPE_DECISIONS.map((d) => (
            <Panel key={d.title} className="gap-2 !p-5">
              <StatusWord st="pending">{d.kind}</StatusWord>
              <b className="font-display text-[20px]/[1.25] font-light">{d.title}</b>
              <p className="text-[13.5px]/[1.55] text-dim">{d.body}</p>
              <button type="button" className="explore w-fit !text-[10.5px]" onClick={(e) => openScreen('session', { n: d.session }, e.currentTarget)}>Discovery {d.session}/6 <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" /></button>
            </Panel>
          ))}
        </section>
        <section className="grid gap-3"><Sec>Observations · {OBSERVATIONS.length}</Sec>
          {OBSERVATIONS.map((o) => (
            <Panel key={o.title} className="gap-2 !p-5">
              <StatusWord st={o.kind === 'Conflict' ? 'blocked' : o.kind === 'Opportunity' ? 'ok' : 'risk'}>{o.kind}</StatusWord>
              <b className="font-display text-[20px]/[1.25] font-light">{o.title}</b>
              <p className="text-[13.5px]/[1.55] text-dim">{o.body}</p>
            </Panel>
          ))}
        </section>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel className="content-start gap-3">
          <span className="eyebrow ink">Consulting objectives</span>
          {OBJECTIVES.map(([k, v], i) => <p key={k} className="text-[14px]/[1.55]"><span className="mr-2 font-mono text-[11px] text-dim">{String(i + 1).padStart(2, '0')}</span><b className="font-medium">{k}.</b> <span className="text-dim">{v}</span></p>)}
          <p className="border-t border-line pt-3 text-[13.5px]/[1.6] text-dim"><b className="font-medium text-text">Working approach.</b> {APPROACH}</p>
        </Panel>
        <Panel className="content-start gap-3">
          <span className="eyebrow ink">Sources · {SOURCES.length} documents</span>
          {SOURCES.map((s) => <span key={s.name} className="flex justify-between gap-3 text-[14px]"><span>{s.name}</span><span className="text-dim tabular-nums">{s.date || '—'}</span></span>)}
          <p className="border-t border-line pt-3 text-[12.5px] text-dim">Confidential · Northlight internal · do not forward.</p>
        </Panel>
      </div>
    </div>
  )
}

export default function BlueprintPage() {
  const [tab, setTab] = useState<Tab>('flow')
  return (
    <div className="arrive grid content-start gap-6">
      <ViewHead label="iii.partners × Northlight · Confidential" title="Blueprint" lead={OVERVIEW.summary} />
      <div role="tablist" aria-label="Blueprint sections" className="state-switch w-fit flex-wrap !rounded-[22px]">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} aria-checked={tab === t.id} onClick={() => setTab(t.id)} className="!px-3.5 !py-2.5">{t.word}</button>
        ))}
      </div>
      <div key={tab} className="rise-in">
        {tab === 'flow' ? <Flow /> : tab === 'insights' ? <Insights /> : tab === 'systems' ? <Systems /> : tab === 'cvos' ? <Cvos /> : <Discovery />}
      </div>
    </div>
  )
}
