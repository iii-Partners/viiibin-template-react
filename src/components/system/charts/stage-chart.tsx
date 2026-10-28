// The stage chart, for work that moves through counted stages: a large Rajdhani total with its label, then one column
// a stage, each a bar rising in proportion to its count with the count over it and the stage's name under it. Where
// every stage holds no more than the one before (a funnel), each column also says what share of the stage before
// reached it. Purple marks where the work is now. With every stage at zero, each column keeps a sliver so the stages
// still read as the path the work will take.
import type { ReactNode } from 'react'
import type { Tone } from './track'

const FILL: Record<Tone, string> = { lit: 'var(--brand)', pending: 'var(--brand)', done: 'var(--teal)', watch: 'var(--watch)', blocked: 'var(--fault)', '': 'var(--teal)' }
const WORD: Partial<Record<Tone, string>> = { lit: 'Where the work is now', pending: 'Where the work is now', watch: 'At risk', blocked: 'Blocked' }

export interface Stage {
  name: string
  n: number
  tone?: Tone
}

export function StageChart({ code, label, meta, stages, empty }: { code: string; label: string; meta?: string; stages: Stage[]; empty?: ReactNode }) {
  const n = stages.map((s) => s.n)
  const max = Math.max(1, ...n)
  const funnel = n.every((v, i) => i === 0 || v <= n[i - 1])
  const total = funnel ? n[0] : n.reduce((a, v) => a + v, 0)
  const legend = [...new Map(stages.filter((s) => WORD[s.tone ?? '']).map((s) => [WORD[s.tone ?? '']!, s.tone ?? ''] as const))]
  return (
    <figure className="gm-tabcard m-0" aria-label={`${label}: ${stages.map((s) => `${s.name} ${s.n}`).join(', ')}.`}>
      <div className="gm-tabcard-body grid gap-5 px-5 pt-3 pb-5">
        <div className="grid gap-1">
          <code className="font-mono text-[11px]/none font-medium tracking-[0.04em] text-brand">[{code}]</code>
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <b className="font-figure text-[56px]/[0.95] font-medium tabular-nums">{total}</b>
            <span className="text-[14px]/[1.3] font-medium">{label}</span>
          </span>
          {meta && <span className="text-[12.5px]/[1.35] text-dim">{meta}</span>}
          {!total && empty && <span className="text-[13px]/[1.45] text-dim">{empty}</span>}
        </div>
        <ol className="m-0 grid list-none gap-3 p-0 @max-[560px]/frame:!grid-cols-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {stages.map((s, i) => (
            <li key={s.name} className="grid min-w-0 content-start gap-2">
              <b className="font-figure text-[32px]/none font-medium tabular-nums">{s.n}</b>
              <span className="flex h-[108px] items-end overflow-hidden rounded-tile bg-glass-raised">
                <i className="rise-in block w-full border-t-[3px]" style={{ height: `${Math.max(3, (s.n / max) * 100)}%`, borderColor: FILL[s.tone ?? ''], background: `color-mix(in srgb, ${FILL[s.tone ?? '']} 24%, transparent)`, animationDelay: `${i * 70}ms` }} />
              </span>
              <span className="grid gap-0.5 border-t-2 border-line pt-2">
                <span className="truncate text-[13px] font-medium" title={s.name}>{s.name}</span>
                {funnel && i > 0 && <span className="text-[12px] text-dim tabular-nums">{n[i - 1] ? Math.round((s.n / n[i - 1]) * 100) : 0} % of {stages[i - 1].name.toLowerCase()}</span>}
              </span>
            </li>
          ))}
        </ol>
        {legend.length > 0 && (
          <figcaption className="flex flex-wrap gap-x-4 gap-y-1 border-t-2 border-line pt-2.5 text-[12.5px] text-dim">
            {legend.map(([w, t]) => (
              <span key={w} className="inline-flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-[1px]" style={{ background: FILL[t] }} />
                {w}
              </span>
            ))}
          </figcaption>
        )}
      </div>
    </figure>
  )
}
