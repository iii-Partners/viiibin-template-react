// The stage chart, for work that moves through counted stages: a large Newsreader total with its label, then one column
// a stage, each a bar rising in proportion to its count with the count over it and the stage's name under it. Where
// every stage holds no more than the one before (a funnel), each column also says what share of the stage before
// reached it. Solid ink marks where the work is now. With every stage at zero, each column keeps a sliver so the stages
// still read as the path the work will take.
import type { ReactNode } from 'react'
import type { Tone } from './track'

const FILL: Record<Tone, string> = { lit: 'var(--text)', pending: 'var(--need)', done: 'var(--edge)', watch: 'var(--watch)', blocked: 'var(--fault)', '': 'var(--edge)' }
const WORD: Partial<Record<Tone, string>> = { lit: 'Where the work is now', pending: 'Needs you', watch: 'At risk', blocked: 'Blocked' }

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
    <figure className="panel m-0" aria-label={`${label}: ${stages.map((s) => `${s.name} ${s.n}`).join(', ')}.`}>
      <div className="grid gap-6">
        <div className="grid gap-1.5">
          <span className="flex items-baseline gap-2.5">
            <code className="font-mono text-[11.5px]/none tracking-[0.04em] text-dim">{code}</code>
            <span className="eyebrow ink">{label}</span>
          </span>
          <b className="figure text-[72px]/[0.95]">{total}</b>
          {meta && <span className="text-[13px]/[1.4] text-dim">{meta}</span>}
          {!total && empty && <span className="text-[13.5px]/[1.5] text-dim">{empty}</span>}
        </div>
        <ol className="m-0 grid list-none gap-3 p-0 @max-[560px]/frame:!grid-cols-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {stages.map((s, i) => (
            <li key={s.name} className="grid min-w-0 content-start gap-2.5">
              <b className="figure text-[36px]/none">{s.n}</b>
              <span className="flex h-[108px] items-end overflow-hidden bg-wash">
                <i className="rise-in block w-full border-t-2" style={{ height: `${Math.max(3, (s.n / max) * 100)}%`, borderColor: FILL[s.tone ?? ''], background: `color-mix(in srgb, ${FILL[s.tone ?? '']} 22%, transparent)`, animationDelay: `${i * 80}ms` }} />
              </span>
              <span className="grid gap-0.5 border-t border-line pt-2.5">
                <span className="truncate text-[13px] font-medium" title={s.name}>{s.name}</span>
                {funnel && i > 0 && <span className="text-[12px] text-dim tabular-nums">{n[i - 1] ? Math.round((s.n / n[i - 1]) * 100) : 0} % of {stages[i - 1].name.toLowerCase()}</span>}
              </span>
            </li>
          ))}
        </ol>
        {legend.length > 0 && (
          <figcaption className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-[12.5px] text-dim">
            {legend.map(([w, t]) => (
              <span key={w} className="inline-flex items-center gap-1.5">
                <i className="h-2 w-2" style={{ background: FILL[t] }} />
                {w}
              </span>
            ))}
          </figcaption>
        )}
      </div>
    </figure>
  )
}
