// Dial geometry for the bird's-eye dial, copied from Fleet Command's (iii.partners) app/src/lib/dial.ts on October 28,
// 2026, which adapted full-metal-svg's dial parts and the reactor gauge's scales. Angles are compass degrees: 0 at the top,
// clockwise. Lengths are the drawing's units, centred on the dial. Pure.

const n = (v: number) => { const r = Math.round(v * 100) / 100; return r === 0 ? 0 : r }
const rad = (deg: number) => (deg * Math.PI) / 180
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Every scale runs clockwise from lower left through the top to lower right, leaving the foot open. */
export const SWEEP = { start: 225, span: 270 } as const
/** Where a share 0 to 1 of a scale sits round the dial. */
export const scaleAngle = (share: number) => n(SWEEP.start + SWEEP.span * clamp01(share))
/** A point at radius `r` and compass angle `deg`. */
export const polar = (r: number, deg: number): [number, number] => [n(r * Math.sin(rad(deg))), n(-r * Math.cos(rad(deg)))]
const pt = (r: number, deg: number) => polar(r, deg).join(' ')
const large = (a0: number, a1: number) => (Math.abs(a1 - a0) > 180 ? 1 : 0)

/** A clockwise arc at `r` from `a0` to `a1`; empty when it has no length. */
export function arc(r: number, a0: number, a1: number) {
  if (a1 - a0 < 0.05) return ''
  return `M${pt(r, a0)}A${r} ${r} 0 ${large(a0, a1)} 1 ${pt(r, a1)}`
}
/** Radial ticks at `r` reaching in by `len`, one at each angle. */
export const ticks = (r: number, len: number, angles: readonly number[]) => angles.map((a) => `M${pt(r, a)}L${pt(r - len, a)}`).join('')
/** Angles every `step` share along the sweep, ends included. */
export const ladder = (step: number) => Array.from({ length: Math.round(1 / step) + 1 }, (_, i) => scaleAngle(i * step))

/** A band from `r0` to `r1` between two angles; `cut` chamfers its outer corners. Empty when it has no length. */
export function arcBand(r0: number, r1: number, a0: number, a1: number, cut = 0) {
  if (a1 - a0 < 0.05) return ''
  const da = cut > 0 ? (cut / r1) * (180 / Math.PI) : 0
  const outer = cut > 0
    ? `L${pt(r1 - cut, a1)}L${pt(r1, a1 - da)}A${r1} ${r1} 0 ${large(a0 + da, a1 - da)} 0 ${pt(r1, a0 + da)}L${pt(r1 - cut, a0)}`
    : `L${pt(r1, a1)}A${r1} ${r1} 0 ${large(a0, a1)} 0 ${pt(r1, a0)}`
  return `M${pt(r0, a0)}A${r0} ${r0} 0 ${large(a0, a1)} 1 ${pt(r0, a1)}${outer}Z`
}

/** The path a text follows round the circle, centred on `angle`: clockwise over the top half, anticlockwise under it,
 *  so the text reads upright either way. Use with startOffset="50%" and a middle anchor. */
export function textArc(r: number, angle: number) {
  const a = ((angle % 360) + 360) % 360, under = a > 90 && a < 270
  return under ? `M${pt(r, a + 90)}A${r} ${r} 0 0 0 ${pt(r, a - 90)}` : `M${pt(r, a - 90)}A${r} ${r} 0 0 1 ${pt(r, a + 90)}`
}
