// Ask's response cards: each block kind (blocks.ts) drawn with the design system's parts. Charts use the same parts as
// the views (StageChart, Bars, Fan, Ring, Timeline, Chain), lists use the same rows, and anything that stands for a
// guest or a retreat opens its live record as a screen. Wide cards take the full width of the answer; small ones
// (a ring, a fan, bars, a note) sit two to a row.
import { ArrowRight, Cog } from 'lucide-react'
import type { ReactNode } from 'react'
import { Panel } from '@/components/system/panel'
import { StatusShape, StatusWord } from '@/components/system/status'
import { StageChart } from '@/components/system/charts/stage-chart'
import { Bars } from '@/components/system/charts/bars'
import { Fan } from '@/components/system/charts/fan'
import { Ring } from '@/components/system/charts/ring'
import { Chain, Timeline } from '@/components/system/charts/track'
import { cn } from '@/lib/utils/cn'
import { openScreen } from '@/stores/screens'
import type { Block } from './blocks'


const openGuest = (id: string, el: HTMLElement) => openScreen('guest', { id }, el)
const openRetreat = (id: string, el: HTMLElement) => openScreen('retreat', { id }, el)

function Head({ children, n }: { children: ReactNode; n?: number }) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="eyebrow ink">{children}</span>
      {n !== undefined && <span className="text-[12px] text-dim tabular-nums">{n}</span>}
    </span>
  )
}

function Stats({ b }: { b: Extract<Block, { kind: 'stats' }> }) {
  return (
    <Panel className="gap-4 !p-5">
      {b.title && <Head>{b.title}</Head>}
      <dl className="m-0 grid gap-x-6 gap-y-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))' }}>
        {b.items.map((s) => (
          <div key={s.label} className="grid min-w-0 content-start gap-1.5 border-l border-line pl-4 first:border-l-0 first:pl-0">
            <dt className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] text-dim uppercase font-caps">
              {s.st && s.st !== 'ok' && <StatusShape st={s.st} />}
              {s.label}
            </dt>
            <dd className="m-0 figure text-[30px]/none">{s.value}</dd>
            {s.sub && <dd className="m-0 text-[12.5px]/[1.4] text-dim">{s.sub}</dd>}
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function Table({ b }: { b: Extract<Block, { kind: 'table' }> }) {
  const live = b.rows.some((r) => r.guestId || r.retreatId)
  return (
    <Panel className="gap-3 !p-5">
      <Head n={b.rows.length}>{b.title}</Head>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[13.5px]/[1.4]">
          <thead>
            <tr>
              {b.columns.map((c) => (
                <th key={c.key} scope="col" className={cn('border-b border-line px-2 pb-2 text-left text-[10.5px] font-medium tracking-[0.1em] text-dim uppercase font-caps', c.align === 'right' && 'text-right')}>{c.label}</th>
              ))}
              {live && <th aria-hidden="true" className="w-6 border-b border-line" />}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => {
              const open = r.guestId ? (el: HTMLElement) => openGuest(r.guestId!, el) : r.retreatId ? (el: HTMLElement) => openRetreat(r.retreatId!, el) : undefined
              return (
                <tr key={i} onClick={open ? (e) => open(e.currentTarget) : undefined} className={cn('group border-b border-line last:border-b-0', open && 'cursor-pointer transition-colors duration-(--dur-hover) hover:bg-wash')}>
                  {b.columns.map((c, j) => (
                    <td key={c.key} className={cn('px-2 py-2.5 align-top tabular-nums', c.align === 'right' && 'text-right', j === 0 && r.st && 'whitespace-nowrap')}>
                      {j === 0 && r.st ? <span className="inline-flex items-center gap-2"><StatusShape st={r.st} />{r.cells[c.key]}</span> : j === 0 && open ? (
                        <button type="button" className="text-left underline decoration-transparent underline-offset-4 group-hover:decoration-line" onClick={(e) => { e.stopPropagation(); open(e.currentTarget) }}>{r.cells[c.key]}</button>
                      ) : r.cells[c.key]}
                    </td>
                  ))}
                  {live && <td className="px-1 text-right">{open && <ArrowRight className="inline h-3.5 w-3.5 text-dim transition-transform duration-(--dur-hover) group-hover:translate-x-0.5 group-hover:text-text" strokeWidth={1.4} aria-hidden="true" />}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {b.note && <p className="text-[12.5px]/[1.5] text-dim">{b.note}</p>}
    </Panel>
  )
}

function Guests({ b }: { b: Extract<Block, { kind: 'guests' }> }) {
  return (
    <Panel className="gap-2 !p-2">
      <span className="px-3 pt-3"><Head>{b.title}</Head></span>
      <ul className="m-0 grid list-none p-0">
        {b.rows.map((g, i) => (
          <li key={g.id} className="rise-in border-t border-line first:border-t-0" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <button type="button" data-door={`guest-${g.id}`} onClick={(e) => openGuest(g.id, e.currentTarget)} className="group grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 px-3 py-3 text-left transition-colors duration-(--dur-hover) hover:bg-wash focus-visible:bg-wash focus-visible:outline-none">
              <span className="grid min-w-0 gap-0.5">
                <span className="truncate font-display text-[17px]/[1.3] font-title">{g.name}{g.returning && <span className="ml-2 align-middle text-[10px] tracking-[0.12em] text-dim uppercase">Returning</span>}</span>
                <span className="truncate text-[13px] text-dim">{g.sub}</span>
              </span>
              <StatusWord st={g.st}>{g.stage}</StatusWord>
              <ArrowRight className="h-4 w-4 text-dim transition-transform duration-(--dur-hover) group-hover:translate-x-1 group-hover:text-text" strokeWidth={1.4} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {!!b.more && <p className="px-3 pb-2 text-[12.5px] text-dim">And {b.more} more. Ask a narrower question to see them.</p>}
    </Panel>
  )
}

function Needs({ b }: { b: Extract<Block, { kind: 'needs' }> }) {
  return (
    <div className="grid gap-3">
      <Head n={b.items.length}>{b.title}</Head>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {b.items.map((x) => (
          <Panel key={x.key} as="button" type="button" live data-door={`guest-${x.guestId}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => openGuest(x.guestId, e.currentTarget)} className="content-start gap-2 !p-4 text-left">
            <span className="flex items-center justify-between gap-3">
              <StatusWord st={x.st}>{x.word}</StatusWord>
              <span className="text-[10.5px] tracking-[0.1em] text-dim uppercase font-caps">{x.owner}</span>
            </span>
            <b className="font-display text-[17px]/[1.3] font-title">{x.title}</b>
            <span className="text-[13px]/[1.5] text-dim">{x.why}</span>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function Guest({ b }: { b: Extract<Block, { kind: 'guest' }> }) {
  return (
    <Panel className="gap-5 !p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <span className="grid min-w-0 gap-1.5">
          <span className="eyebrow">Guest</span>
          <b className="font-display text-[28px]/[1.15] font-title">{b.name}</b>
          <span className="text-[13.5px] text-dim">{b.headline}</span>
        </span>
        <span className="flex items-center gap-4">
          <StatusWord st={b.st}>{b.stage}</StatusWord>
          <button type="button" className="pill sm" data-door={`guest-${b.id}`} onClick={(e) => openGuest(b.id, e.currentTarget)}>Open record</button>
        </span>
      </div>
      <Chain label={`${b.name}’s journey`} steps={b.journey} />
      <div className="grid gap-6 @min-[720px]/frame:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <dl className="m-0 grid content-start gap-0">
          {b.facts.map((f) => (
            <div key={f.label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
              <dt className="text-[12.5px] text-dim">{f.label}</dt>
              <dd className="m-0 text-[13.5px]/[1.45]">{f.value}</dd>
            </div>
          ))}
        </dl>
        {b.forms.length > 0 && (
          <div className="grid content-start gap-2.5">
            <span className="eyebrow">Readiness</span>
            {b.forms.map((f) => (
              <span key={f.word} className="flex items-center justify-between gap-3 border-t border-line pt-2.5 text-[13px] first:border-t-0 first:pt-0">
                <span className="flex items-center gap-2">
                  <i className={cn('block h-2.5 w-2.5 rounded-[2px]', f.state === 'done' ? 'bg-text' : f.state === 'late' ? 'bg-fault' : 'bg-wash ring-1 ring-edge/50 ring-inset')} aria-hidden="true" />
                  {f.word}
                </span>
                <span className={cn('tabular-nums', f.state === 'late' ? 'text-fault' : 'text-dim')}>{f.state === 'done' ? 'Returned' : f.state === 'late' ? `Overdue · ${f.due}` : `Due ${f.due}`}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

function Retreats({ b }: { b: Extract<Block, { kind: 'retreats' }> }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
      {b.items.map((r) => (
        <Panel key={r.id} as="button" type="button" live data-door={`retreat-${r.id}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => openRetreat(r.id, e.currentTarget)} className="content-start gap-2.5 !p-4 text-left">
          <span className="eyebrow">{r.when}</span>
          <span className="font-display text-[18px]/[1.25] font-title">{r.name}</span>
          <span className="text-[12.5px] text-dim">{r.window} · {r.facilitator}</span>
          <span className="flex h-1.5 overflow-hidden bg-wash" aria-hidden="true">
            <i className="block h-full bg-text" style={{ width: `${(r.booked / r.rooms) * 100}%` }} />
            <i className="block h-full bg-edge/50" style={{ width: `${(r.held / r.rooms) * 100}%` }} />
          </span>
          <span className="flex items-baseline gap-2">
            <b className="figure text-[24px]/none">{r.booked}</b>
            <span className="text-[12.5px] text-dim">of {r.rooms} rooms{r.held ? `, ${r.held} held` : ''}</span>
            {r.st === 'risk' && <StatusWord st="risk" className="ml-auto">Under half</StatusWord>}
          </span>
        </Panel>
      ))}
    </div>
  )
}

function Activity({ b }: { b: Extract<Block, { kind: 'activity' }> }) {
  return (
    <Panel className="gap-3 !p-5">
      <Head n={b.items.length}>{b.title}</Head>
      <ol className="m-0 grid list-none p-0">
        {b.items.map((e, i) => (
          <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
            <span className={cn('mt-0.5 grid h-6 w-6 place-items-center rounded-full border', e.auto ? 'border-accent text-accent' : 'border-edge text-text')} aria-hidden="true">
              {e.auto ? <Cog size={12} strokeWidth={1.5} /> : <span className="text-[10px] font-medium">{e.actor.replace(/^Dr\. /, '').slice(0, 1)}</span>}
            </span>
            <span className="grid min-w-0 gap-0.5 text-[13px]/[1.5]">
              <span>
                <b className="font-medium">{e.auto ? 'NL-OS' : e.actor}</b>
                {e.guestId && e.guest && <>{' · '}<button type="button" className="underline decoration-line underline-offset-4 hover:decoration-text" onClick={(ev) => openGuest(e.guestId!, ev.currentTarget)}>{e.guest}</button></>}
                <span className="text-dim"> · {e.at}</span>
              </span>
              <span className="text-dim">{e.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

function Insights({ b }: { b: Extract<Block, { kind: 'insights' }> }) {
  return (
    <div className="grid gap-3">
      <Head n={b.items.length}>{b.title}</Head>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {b.items.map((x) => (
          <Panel key={x.id} as="button" type="button" live onClick={(e: React.MouseEvent<HTMLButtonElement>) => openScreen('insight', { id: x.id }, e.currentTarget)} className="content-start gap-2 !p-4 text-left">
            <span className="flex items-center justify-between gap-3 text-[10.5px] tracking-[0.1em] text-dim uppercase font-caps"><span>{x.tag}</span><span className="font-mono">{x.id}</span></span>
            <b className="font-display text-[17px]/[1.3] font-title">{x.title}</b>
            <span className="line-clamp-3 text-[13px]/[1.5] text-dim">{x.body}</span>
            <span className="border-t border-line pt-2 text-[12.5px]/[1.5]"><span className="text-dim">In NL-OS: </span>{x.answer}</span>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function BlockCard({ b }: { b: Block }) {
  switch (b.kind) {
    case 'stats': return <Stats b={b} />
    case 'stages': return <StageChart code={b.code} label={b.title} meta={b.meta} stages={b.stages} />
    case 'bars': return <Panel className="gap-3 !p-5"><Head>{b.title}</Head><Bars label={b.title} rows={b.rows} max={b.max} mark={b.mark} markLabel={b.markLabel} onPick={(row, el) => { const r = b.rows.find((x) => x.name === row.name); if (r?.guestId) openGuest(r.guestId, el as HTMLElement); else if (r?.retreatId) openRetreat(r.retreatId, el as HTMLElement) }} /></Panel>
    case 'fan': return <Panel className="gap-3 !p-5"><Head>{b.title}</Head><Fan label={b.title} total={b.total} totalLabel={b.totalLabel} sub={b.sub} parts={b.parts} /></Panel>
    case 'ring': return <Panel className="justify-items-center gap-3 !p-5"><span className="justify-self-stretch"><Head>{b.title}</Head></span><Ring value={b.value} plan={b.plan} big={b.big} unit={b.unit} sub={b.sub} st={b.st} label={`${b.title}: ${b.big} ${b.unit}`} size={190} />{b.note && <p className="text-center text-[12.5px]/[1.5] text-dim">{b.note}</p>}</Panel>
    case 'table': return <Table b={b} />
    case 'guests': return <Guests b={b} />
    case 'needs': return <Needs b={b} />
    case 'guest': return <Guest b={b} />
    case 'retreats': return <Retreats b={b} />
    case 'timeline': return <Panel className="gap-3 !p-5"><Head>{b.title}</Head><Timeline label={b.title} start={b.start} end={b.end} today={b.today} todayLabel={b.todayLabel} items={b.items} /></Panel>
    case 'activity': return <Activity b={b} />
    case 'insights': return <Insights b={b} />
    case 'chain': return <Panel className="gap-3 !p-5"><Head>{b.title}</Head><Chain label={b.title} steps={b.steps} /></Panel>
    case 'note': return <Panel className="gap-1.5 !p-5">{b.title && <Head>{b.title}</Head>}<p className="text-[13.5px]/[1.55] text-dim">{b.text}</p></Panel>
  }
}
