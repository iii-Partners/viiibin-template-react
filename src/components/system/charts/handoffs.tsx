// Handoffs: a count at the start, then a paired row for each later stage. Each row has its count, a track filled by
// its share of the stage before (ink for motion, ocean blue for delivery), a thin track for the stage before, and a
// ringed marker on a leader with the percentage. Every row reads one handoff: of the visits, how many signed up; of
// those, how many came back. A stage after an empty one reads 0 %, never a division by zero.
export interface Handoff {
  name: string
  n: number
  /** motion is activity; delivery is a finished result */
  kind: 'motion' | 'delivery'
}

const TONE = { motion: 'var(--text)', delivery: 'var(--done)' }

export function Handoffs({ label, rows }: { label: string; rows: Handoff[] }) {
  const [first, ...rest] = rows
  if (!first) return null
  return (
    <figure className="m-0 grid gap-4" aria-label={`${label}: ${rows.map((r) => `${r.name} ${r.n}`).join(', ')}.`}>
      <div className="flex items-baseline gap-3 border-b border-line pb-4">
        <b className="figure text-[52px]/none">{first.n}</b>
        <span className="grid gap-1">
          <span className="eyebrow ink">{first.name}</span>
          <span className="text-[13px] text-dim">Every row below is a share of the row above it</span>
        </span>
      </div>
      {rest.map((r, i) => {
        const prev = rows[i]
        const pct = prev.n ? Math.round((r.n / prev.n) * 100) : 0
        return (
          <div key={r.name} className="grid grid-cols-[minmax(92px,128px)_minmax(0,1fr)] items-center gap-x-5" aria-hidden="true">
            <span className="grid gap-0.5">
              <b className="figure text-[38px]/none" style={{ color: r.kind === 'delivery' ? 'var(--done)' : undefined }}>{r.n}</b>
              <span className="text-[12.5px]/[1.25] font-medium">{r.name}</span>
              <span className="text-[11.5px]/[1.25] text-dim">of {prev.n} {prev.name.toLowerCase()}</span>
            </span>
            <span className="relative grid h-[76px] content-start gap-[18px] pt-[6px]">
              <span className="flex h-3 overflow-hidden bg-wash">
                <i className="rise-in block h-full" style={{ width: `${Math.max(1, pct)}%`, background: TONE[r.kind], animationDelay: `${i * 80}ms` }} />
              </span>
              <span className="h-1 bg-line" />
              <span className="absolute top-[24px] flex w-0 flex-col items-center" style={{ left: `${pct}%` }}>
                <i className="grid h-[24px] w-[24px] flex-none place-items-center rounded-full border-[1.5px] bg-panel" style={{ borderColor: TONE[r.kind] }}>
                  <i className="h-2 w-2 rounded-full" style={{ background: TONE[r.kind] }} />
                </i>
                <i className="h-2.5 w-0 flex-none border-l border-dashed border-edge" />
                <span className={`figure text-[18px]/none whitespace-nowrap ${pct > 92 ? '-translate-x-1/3' : ''}`}>{pct} %</span>
              </span>
            </span>
          </div>
        )
      })}
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-[12.5px] text-dim">
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 bg-text" />Motion: activity</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 bg-done" />Delivery: a finished result</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-1 w-4 bg-line" />The stage before</span>
      </figcaption>
    </figure>
  )
}
