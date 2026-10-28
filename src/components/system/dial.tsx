// The dial, after Fleet Command's hub dial (itself after the plant board's reactor dial), adapted to read any app's
// data from above. Drawn in a 460-unit drawing centred at the origin. Every ring reads something:
//   01 the heavy band   a share 0 to 1 (progress), the room left to it dashed, a marker at the reading
//   02 the cell ring    a mix: fifty cells colored in proportion to the parts
//   03 the flow ring    a count out of a whole (activity)
//   04 the window       a run of days, one cell a day, lit when something happened
//   the needle          a share of a limit (time since the last change, toward going quiet)
//   the arched labels   the name at the top, the status word at the foot, set into gaps in the heavy ring
// Pointing at a ring lights it (and tells the caller, so its card can light too). With no data, every ring is an
// empty track and the reading is zero, so the dial already shows what it will measure. With `fault` (the data did not
// load), nothing is read: the tracks run dashed, no marker or needle shows, the centre says No signal and the foot
// says Offline, so a failure never passes for an empty app. With `loading`, the rings breathe until the data lands.
import { useLayoutEffect, useRef, useState } from 'react'
import { SWEEP, arc, arcBand, ladder, polar, scaleAngle, textArc, ticks } from '@/lib/dial'
import { STATUS_VAR, type Status } from './status'

export type DialTone = Status | 'quiet'
const COLOR: Record<DialTone, string> = { ...STATUS_VAR, quiet: 'var(--teal)' }

export type DialRing = 1 | 2 | 3 | 4

export interface DialReading {
  /** 01: a share 0 to 1, its figure, what it counts, and a line under it */
  pct: number
  big: string
  unit: string
  sub: string
  /** 02: the parts of the whole, in ring order */
  mix: { tone: DialTone; n: number; label: string }[]
  /** 03: a count out of a whole */
  flow: { n: number; of: number; label: string }
  /** 04: one entry a day, oldest first; true when something happened */
  days: boolean[]
  daysLabel: string
  /** the needle: a share 0 to 1 of a limit */
  needle?: { share: number; label: string }
  top: string
  st: DialTone
  word: string
}

/** The radii, in drawing units. */
export const DR = { heavy: 196, light: 189, ladder: 185, band: [162, 175], cells: [138, 153], flow: 120, inner: 108, window: [112, 127] } as const
const END = SWEEP.start + SWEEP.span
// the window sits in the dial's open foot, between the scales' ends
const WINDOW = { a0: 148, a1: 212 } as const
/** Where each card's tendril lands, in the cards' top-to-bottom order so no tendril crosses another. */
export const DIAL_TAGS: Record<DialRing, { r: number; at: number }> = {
  1: { r: DR.band[1] + 2, at: 48 },
  2: { r: DR.cells[1], at: 74 },
  3: { r: DR.flow + 2, at: 102 },
  4: { r: DR.window[1], at: 200 },
}
export const DIAL_BOX = 230

export function Dial({ d: given, id, hot, onHot, fault = false, loading = false }: { d: DialReading; id: string; hot: DialRing | null; onHot(r: DialRing | null): void; fault?: boolean; loading?: boolean }) {
  // with no signal, every reading is withheld rather than shown as zero
  const d: DialReading = fault
    ? { ...given, pct: 0, big: '–', unit: 'No signal', sub: 'The data did not load', mix: given.mix.map((m) => ({ ...m, n: 0 })), flow: { n: 0, of: 0, label: '' }, days: given.days.map(() => false), daysLabel: 'No readings', needle: undefined, st: 'blocked', word: 'Offline' }
    : loading
      ? { ...given, pct: 0, big: '–', unit: 'Reading', sub: 'The data is on its way', mix: given.mix.map((m) => ({ ...m, n: 0 })), flow: { n: 0, of: 0, label: '' }, days: given.days.map(() => false), daysLabel: 'Reading…', needle: undefined, st: 'quiet', word: 'Reading' }
      : given
  const [, num = d.big, unitSign = ''] = /^([\d.,]+)(\D*)$/.exec(d.big) ?? []
  const bigRef = useRef<SVGTextElement>(null)
  const [half, setHalf] = useState(0)
  // measure the digits once the figure font has loaded, so a unit sign lands at their real edge
  useLayoutEffect(() => {
    const m = () => setHalf((bigRef.current?.getComputedTextLength?.() ?? 0) / 2)
    m()
    document.fonts?.ready.then(m)
  }, [num])
  const aProg = scaleAngle(d.pct)
  const aFlow = scaleAngle(d.flow.of ? d.flow.n / d.flow.of : 0)
  const aNeedle = d.needle ? scaleAngle(d.needle.share) : undefined
  // fifty cells, each colored by its share of the parts; an empty mix stays fifty empty cells
  const total = d.mix.reduce((a, m) => a + m.n, 0)
  const cells: (DialTone | null)[] = []
  if (total) d.mix.forEach((m) => { const k = Math.round((m.n / total) * 50); for (let i = 0; i < k && cells.length < 50; i++) cells.push(m.tone) })
  while (cells.length < 50) cells.push(total ? cells[cells.length - 1] : null)
  const curve = (key: string, r: number, angle: number) => <path id={`${id}-${key}`} d={textArc(r, angle)} fill="none" />
  // the heavy ring parts where the name and the status word run along it
  const gap = (t: string) => ((t.length * 8.8 + 26) / 2 / DR.heavy) * (180 / Math.PI)
  const gTop = gap(d.top), gFoot = gap(d.word)
  const marker = (r: number, a: number) => { const [x, y] = polar(r, a); return <circle cx={x} cy={y} r="4" className="dl-marker" /> }
  // each ring's group: lit when pointed at, quiet while another is
  const ring = (r: DialRing) => ({
    className: `dl-ring ${hot === r ? 'dl-hot' : hot ? 'dl-dim' : ''}`,
    onPointerEnter: () => onHot(r),
    onPointerLeave: () => onHot(null),
  })
  const lit = d.days.filter(Boolean).length
  return (
    <svg viewBox={`${-DIAL_BOX} ${-DIAL_BOX} ${DIAL_BOX * 2} ${DIAL_BOX * 2}`} className={`dl block h-auto w-full overflow-visible ${fault ? 'dl-fault' : loading ? 'dl-loading' : ''}`} role="img"
      aria-label={`${d.top}: ${d.big} ${d.unit}, ${d.sub}. ${d.mix.map((m) => `${m.label} ${m.n}`).join(', ')}. ${d.flow.label}. ${d.daysLabel}.${d.needle ? ` ${d.needle.label}.` : ''} ${d.word}.`}>
      <defs>{curve('top', DR.heavy, 0)}{curve('foot', DR.heavy, 180)}{curve('win', 141, 180)}{curve('unit', 84, 0)}{curve('flow', 92, 180)}</defs>
      {/* the bezel: stand-offs at the diagonals, the heavy ring, the ladder (a tick every 2.5 %, long every 10 %) */}
      <path className="dl-hair" d={[45, 135, 225, 315].map((a) => arcBand(202, 210, a - 6, a + 6, 3)).join('')} />
      {[90, 270].flatMap((a) => [a - 12, a + 12].map((b) => { const [x, y] = polar(206, b); return <circle key={`${a}-${b}`} cx={x} cy={y} r="1.8" className="dl-dot" /> }))}
      <path className="dl-bold" d={arc(DR.heavy, gTop, 180 - gFoot) + arc(DR.heavy, 180 + gFoot, 360 - gTop)} />
      <circle r={DR.light} className="dl-hair" />
      <circle r={DR.inner} className="dl-faint" />
      <path className="dl-hair" d={ticks(DR.ladder, 4, ladder(0.025))} />
      <path className="dl-base" d={ticks(DR.ladder, 8, ladder(0.1))} />
      {/* 01: the share */}
      <g {...ring(1)}>
        <path className="dl-hit" d={arc(168, SWEEP.start, END)} />
        <path className="dl-track" d={arc(168, SWEEP.start, END)} />
        <path className="dl-room" d={arcBand(DR.band[0], DR.band[1], aProg, END)} />
        <path className="dl-band" d={arcBand(DR.band[0], DR.band[1], SWEEP.start, aProg)} />
        {!fault && !loading && marker(DR.band[1] + 3, aProg)}
      </g>
      {/* the needle, over the band */}
      {aNeedle !== undefined && (() => {
        const [x, y] = polar(DR.light - 1, aNeedle), [lx, ly] = polar(DR.light + 8, aNeedle - 3), [rx, ry] = polar(DR.light + 8, aNeedle + 3)
        return <g className="dl-needle"><path d={ticks(DR.heavy - 1, 34, [aNeedle])} /><path d={`M${x} ${y}L${lx} ${ly}L${rx} ${ry}Z`} className="dl-needle-head" /></g>
      })()}
      {/* 02: the mix */}
      <g {...ring(2)}>
        <path className="dl-hit" d={arc((DR.cells[0] + DR.cells[1]) / 2, SWEEP.start, END)} />
        {cells.map((t, i) => {
          const a = SWEEP.start + (SWEEP.span * (i + 0.5)) / 50
          return <path key={i} className={t ? 'dl-cell' : 'dl-cell dl-cell-empty'} style={t ? { stroke: COLOR[t] } : undefined} d={ticks(DR.cells[1], DR.cells[1] - DR.cells[0], [a])} />
        })}
      </g>
      {/* 03: the count out of the whole */}
      <g {...ring(3)}>
        <path className="dl-hit" d={arc(DR.flow, SWEEP.start, END)} />
        <path className="dl-track" d={arc(DR.flow, SWEEP.start, END)} />
        <path className="dl-line" d={arc(DR.flow, SWEEP.start, aFlow)} />
        <path className="dl-hair" d={ticks(DR.flow - 3, 3, ladder(0.05)) + ticks(DR.flow - 3, 6, ladder(0.25))} />
        {!fault && !loading && marker(DR.flow, aFlow)}
        <text className="dl-mid"><textPath href={`#${id}-flow`} startOffset="50%">{d.flow.label}</textPath></text>
      </g>
      {/* 04: the days, a cell a day */}
      <g {...ring(4)}>
        <path className="dl-hit" d={arcBand(DR.window[0], DR.window[1], WINDOW.a0, WINDOW.a1)} />
        <path className="dl-window-box" d={arcBand(DR.window[0], DR.window[1], WINDOW.a0, WINDOW.a1, 3)} />
        {d.days.map((on, i) => {
          const s = (WINDOW.a1 - WINDOW.a0 - 3) / d.days.length, a = WINDOW.a0 + 1.5 + i * s
          return <path key={i} className="dl-wcell" data-on={on ? '' : undefined} d={arcBand(DR.window[0] + 3, DR.window[1] - 3, a + s * 0.18, a + s * 0.82)} />
        })}
        <text className="dl-small"><textPath href={`#${id}-win`} startOffset="50%">{fault || loading ? d.daysLabel : lit ? d.daysLabel : 'No activity yet'}</textPath></text>
      </g>
      {/* the name at the top and the status word at the foot, set into the heavy ring */}
      <text className="dl-tabtext"><textPath href={`#${id}-top`} startOffset="50%">{d.top}</textPath></text>
      <text className="dl-tabtext" style={{ fill: COLOR[d.st] }}><textPath href={`#${id}-foot`} startOffset="50%">{d.word}</textPath></text>
      {/* the reading: the figure centres on its digits; a unit sign (%) sits just off their right edge */}
      <text className="dl-small"><textPath href={`#${id}-unit`} startOffset="50%">{d.unit}</textPath></text>
      <text ref={bigRef} className="dl-big" y={-6}>{num}</text>
      {unitSign && <text className="dl-big-unit" x={half + 3} y={-26}>{unitSign}</text>}
      <text className="dl-small" y={40}>{d.sub}</text>
    </svg>
  )
}
