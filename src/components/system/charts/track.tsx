// The track: steps and timelines. One rail filled purple to where the work is now, a tick ruler under it, and a
// ringed marker on a dashed guide at each step, its name and detail under the guide, in sentence case. Labels
// alternate two rows past five steps, or wherever the steps sit closer than their longest label (a phone). A timeline places its
// steps on its own scale and draws a Today line with its label above the rail. The legend names every ring color it
// uses. Before any step is done the rail is empty and every ring reads Ahead, which is itself the plan.
import { useLayoutEffect, useRef, useState } from 'react'

export type Tone = 'done' | 'lit' | 'pending' | 'watch' | 'blocked' | ''

const RING: Record<Tone, string> = { done: 'var(--done)', lit: 'var(--brand)', pending: 'var(--brand)', watch: 'var(--watch)', blocked: 'var(--fault)', '': 'var(--line)' }
const WORD: Record<Tone, string> = { done: 'Done', lit: 'Where the work is now', pending: 'Needs a decision', watch: 'At risk', blocked: 'Blocked', '': 'Ahead' }
const ORDER: Tone[] = ['done', 'lit', 'pending', 'watch', 'blocked', '']

export interface TrackPoint {
  at: number
  title: string
  sub?: string
  tone?: Tone
}

export function Track({ label, points, now, nowLabel, ruler }: { label: string; points: TrackPoint[]; now: number; nowLabel?: string; ruler: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // a label is about 7 px a character at 12 to 13 px; two rows when neighbors sit closer than the longest label
  const longest = Math.max(0, ...points.map((p) => Math.max(p.title.length, p.sub?.length ?? 0)))
  const two = points.length > 5 || (w > 0 && w / Math.max(1, points.length - 1) < Math.max(84, longest * 7 + 16))
  const top = nowLabel ? 20 : 0
  const legend = [...new Set(points.map((p) => p.tone ?? ''))].sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y))
  return (
    <figure className="m-0 grid gap-3 px-2 pt-2" aria-label={`${label}: ${points.map((p) => `${p.title}${p.sub ? ` ${p.sub}` : ''}, ${WORD[p.tone ?? ''].toLowerCase()}`).join('; ')}.`}>
      <div ref={box} className="relative mx-3" style={{ height: (two ? 160 : 116) + top }} aria-hidden="true">
        <span style={{ top: 22 + top }} className="absolute inset-x-0 flex h-2.5 overflow-hidden rounded-chip bg-glass-raised">
          <i className="block h-full bg-lit" style={{ width: `${Math.max(0, Math.min(1, now)) * 100}%` }} />
        </span>
        <i className="absolute inset-x-0 block h-2.5 opacity-80" style={{ top: 38 + top, backgroundImage: 'linear-gradient(to right, var(--teal) 1px, transparent 1px), linear-gradient(to right, var(--line) 1px, transparent 1px)', backgroundSize: `25% 10px, ${100 / Math.max(1, ruler)}% 5px`, backgroundRepeat: 'repeat-x' }} />
        {nowLabel && (
          <span className="absolute top-0 w-0" style={{ left: `${now * 100}%`, height: top + 52 }}>
            <i className="absolute top-0 bottom-0 left-0 w-0 border-l-2 border-brand" />
            <span className="absolute top-0 left-1.5 text-[12px]/none font-medium whitespace-nowrap text-brand">{nowLabel}</span>
          </span>
        )}
        {points.map((p, i) => {
          const low = two && i % 2 === 1
          const edge = p.at <= 0.02 ? 'start' : p.at >= 0.98 ? 'end' : 'mid'
          return (
            <span key={i} className="rise-in absolute flex w-0 flex-col items-center" style={{ top: 14 + top, left: `${p.at * 100}%`, animationDelay: `${80 + i * 60}ms` }}>
              <i className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full border-2 bg-glass" style={{ borderColor: RING[p.tone ?? ''] }}>
                <i className="h-2 w-2 rounded-full" style={{ background: p.tone ? RING[p.tone] : 'transparent' }} />
              </i>
              <i className={`w-0 flex-none border-l border-dashed border-teal ${low ? 'h-[62px]' : 'h-[20px]'}`} />
              <span className={`grid gap-0.5 whitespace-nowrap ${edge === 'start' ? 'translate-x-[calc(50%-13px)] justify-items-start' : edge === 'end' ? '-translate-x-[calc(50%-13px)] justify-items-end' : 'justify-items-center'}`}>
                <b className="text-[13px]/[1.2] font-medium" style={{ color: p.tone === 'lit' || p.tone === 'pending' ? 'var(--brand)' : undefined }}>{p.title}</b>
                {p.sub && <span className="text-[12px]/[1.2] text-dim">{p.sub}</span>}
              </span>
            </span>
          )
        })}
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 border-t-2 border-line pt-2.5 text-[12.5px] text-dim">
        {legend.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: RING[t], background: t ? RING[t] : 'transparent' }} />
            {WORD[t]}
          </span>
        ))}
        {nowLabel && (
          <span className="inline-flex items-center gap-1.5">
            <i className="h-3 w-0 border-l-2 border-brand" />
            {nowLabel.split(' · ')[0]}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

/** Steps spaced evenly; now is the last step in progress, else the last one done. */
export function Chain({ label, steps }: { label: string; steps: { title: string; sub?: string; tone?: Tone }[] }) {
  const n = steps.length
  const at = (i: number) => (n > 1 ? i / (n - 1) : 0)
  const cur = steps.map((s) => s.tone).lastIndexOf('lit')
  const done = steps.map((s) => s.tone).lastIndexOf('done')
  const now = cur >= 0 ? at(cur) : done >= 0 ? at(done) : 0
  return <Track label={label} ruler={(n - 1) * 4 || 4} now={now} points={steps.map((s, i) => ({ ...s, at: at(i) }))} />
}

/** Events placed on their own scale (days, weeks), with a Today line. */
export function Timeline({ label, start, end, today, todayLabel = 'Today', items }: { label: string; start: number; end: number; today: number; todayLabel?: string; items: { at: number; title: string; sub?: string; tone?: Tone }[] }) {
  const span = Math.max(1, end - start)
  const at = (v: number) => Math.max(0, Math.min(1, (v - start) / span))
  return <Track label={label} ruler={span} now={at(today)} nowLabel={todayLabel} points={items.map((it) => ({ ...it, at: at(it.at) }))} />
}
