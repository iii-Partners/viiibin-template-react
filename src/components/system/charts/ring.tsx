// The ring gauge, after Fleet Command's reactor dial at small scale: a heavy band filled clockwise from the top to the
// reading, a hairline plan ring inside it with a tick at the plan, sixty fine ticks around the rim, and the figure in
// Rajdhani at the center with its unit. SVG only. At zero the band is an empty track and the figure reads 0, so the
// gauge already shows what it will measure.
import { STATUS_VAR, type Status } from '../status'

export function Ring({ value, plan, big, unit, sub, label, st, size = 220 }: { value: number; plan?: number; big: string; unit: string; sub?: string; label: string; st?: Status; size?: number }) {
  const c = 110, r = 84, rp = 70
  const v = Math.max(0, Math.min(1, value))
  const arc = (rr: number, f: number) => {
    if (f >= 0.9999) return `M${c} ${c - rr}A${rr} ${rr} 0 1 1 ${c - 0.01} ${c - rr}`
    const a = f * Math.PI * 2 - Math.PI / 2
    return `M${c} ${c - rr}A${rr} ${rr} 0 ${f > 0.5 ? 1 : 0} 1 ${(c + rr * Math.cos(a)).toFixed(2)} ${(c + rr * Math.sin(a)).toFixed(2)}`
  }
  const color = st ? STATUS_VAR[st] : 'var(--brand)'
  const pa = plan != null ? Math.max(0, Math.min(1, plan)) * Math.PI * 2 - Math.PI / 2 : null
  return (
    <svg viewBox="0 0 220 220" width={size} height={size} role="img" aria-label={label} className="block max-w-full overflow-visible">
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2, long = i % 5 === 0
        const r1 = 101, r2 = long ? 108 : 105
        return <line key={i} x1={c + r1 * Math.sin(a)} y1={c - r1 * Math.cos(a)} x2={c + r2 * Math.sin(a)} y2={c - r2 * Math.cos(a)} stroke={long ? 'var(--teal)' : 'var(--line)'} strokeWidth={1} />
      })}
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--glass-raised)" strokeWidth={12} />
      {v > 0 && <path d={arc(r, v)} fill="none" stroke={color} strokeWidth={12} strokeLinecap="butt" className="ring-band" />}
      <circle cx={c} cy={c} r={rp} fill="none" stroke="var(--line)" strokeWidth={1} />
      {plan != null && <path d={arc(rp, plan)} fill="none" stroke="var(--teal)" strokeWidth={2} />}
      {pa != null && <line x1={c + (rp - 6) * Math.cos(pa)} y1={c + (rp - 6) * Math.sin(pa)} x2={c + (r + 8) * Math.cos(pa)} y2={c + (r + 8) * Math.sin(pa)} stroke="var(--fault)" strokeWidth={2} />}
      <text x={c} y={c + 8} textAnchor="middle" fontFamily="var(--font-figure)" fontWeight={500} fontSize={44} fill="var(--text)">{big}</text>
      <text x={c} y={c + 30} textAnchor="middle" fontFamily="var(--font-body)" fontWeight={600} fontSize={10.5} letterSpacing="0.1em" fill="var(--dim)">{unit.toUpperCase()}</text>
      {sub && <text x={c} y={c + 46} textAnchor="middle" fontFamily="var(--font-body)" fontSize={11} fill="var(--dim)">{sub}</text>}
    </svg>
  )
}
