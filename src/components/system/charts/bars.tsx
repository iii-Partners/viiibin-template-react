// Bars in SVG: a row a name, its bar on a hairline track in a 560-wide viewBox, and its label at the end. An optional
// mark draws a target line across every row. Status colors only where a row carries a status. Rows that point at a
// record take a press: the row lights on hover and opens its record.
export interface BarRow {
  name: string
  v: number
  label: string
  tone?: 'watch' | 'blocked' | 'done'
}

export function Bars({ label, rows, max, mark, markLabel, onPick }: { label: string; rows: BarRow[]; max: number; mark?: number; markLabel?: string; onPick?(row: BarRow, el: Element): void }) {
  const W = 560, rh = 26, x0 = 160, x1 = W - 76
  const top = Math.max(1, max)
  const xv = (v: number) => x0 + (Math.min(v, top) / top) * (x1 - x0)
  return (
    <svg className="fsvg" viewBox={`0 0 ${W} ${rows.length * rh + 24}`} role="img" aria-label={`${label}: ${rows.map((r) => `${r.name} ${r.label}`).join(', ')}.`}>
      {mark != null && (
        <>
          <line x1={xv(mark)} x2={xv(mark)} y1={0} y2={rows.length * rh + 4} className="today" />
          <text x={xv(mark) + 4} y={rows.length * rh + 18} className="ns" style={{ fill: 'var(--accent)' }}>{markLabel}</text>
        </>
      )}
      {rows.map((r, i) => {
        const y = i * rh + 6
        return (
          <g key={r.name} className={onPick ? 'bar-row cursor-pointer' : undefined} onClick={onPick ? (e) => onPick(r, e.currentTarget) : undefined}>
            <rect x={0} y={y - 4} width={W} height={rh} fill="transparent" />
            <text x={0} y={y + 12} className="ns">{r.name.length > 24 ? `${r.name.slice(0, 23)}…` : r.name}</text>
            <rect x={x0} y={y + 3} width={x1 - x0} height={10} className="bar-bg" />
            <rect x={x0} y={y + 3} width={Math.max(2, xv(r.v) - x0)} height={10} className={`bar ${r.tone ?? ''}`} />
            <text x={x1 + 8} y={y + 12} className="nv" style={{ fontSize: 11.5 }}>{r.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
