// The reel's paired track, after Fleet Command's graphs reel: a large Newsreader figure with its label, then the
// reading as one track cut into segments by status, a thin comparison track under it, and a ringed marker on a dashed
// guide at each segment's end, its count beside it. Status keeps its own color, and the legend sets each color beside
// its word. Built in HTML so the rings stay round at any width. With nothing counted yet, the track stays empty, the
// legend still names every segment at zero, and `empty` says what will fill it.
import type { ReactNode } from 'react'
import { STATUS_VAR, type Status } from '../status'

/** A status, or a plain measure: ink for the main reading, accent (ocean) for the second, quiet for the rest. */
export type ReelTone = Status | 'quiet' | 'ink' | 'accent'
const COLOR: Record<ReelTone, string> = { ...STATUS_VAR, quiet: 'var(--edge)', ink: 'var(--text)', accent: 'var(--accent)' }

export interface ReelSeg {
  label: string
  n: number
  st: ReelTone
}

export function ReelTrack({ code, big, label, meta, segs, compare, empty }: {
  code: string
  big: string | number
  label: string
  meta?: string
  segs: ReelSeg[]
  /** the thin track under the reading: a share 0 to 1 and what it measures */
  compare?: { share: number; label: string }
  /** what the viewer sees while every segment is zero */
  empty?: ReactNode
}) {
  const sum = segs.reduce((a, s) => a + s.n, 0)
  const total = sum || 1
  // each marker sits at its segment's end: the running sum of the counts so far
  const marks = segs.filter((s) => s.n > 0).map((s, i, all) => ({ ...s, at: all.slice(0, i + 1).reduce((a, x) => a + x.n, 0) / total }))
  return (
    <figure className="panel m-0" aria-label={`${label}: ${big}. ${segs.map((s) => `${s.label} ${s.n}`).join(', ')}.${compare ? ` ${compare.label}.` : ''}`}>
      <div className="grid grid-cols-[minmax(150px,210px)_minmax(0,1fr)] items-center gap-x-8 gap-y-4 @max-[700px]/frame:grid-cols-1">
        <div className="grid gap-1.5">
          <span className="flex items-baseline gap-2.5">
            <code className="font-mono text-[11.5px]/none tracking-[0.04em] text-dim">{code}</code>
            <span className="eyebrow ink">{label}</span>
          </span>
          <b className="figure text-[72px]/[0.95]">{big}</b>
          {meta && <span className="text-[13px]/[1.4] text-dim">{meta}</span>}
        </div>
        <div className={`relative mr-2 grid gap-2 pt-1 ${sum ? 'pb-10' : 'pb-1'}`} aria-hidden="true">
          {/* the reading: one track cut by status */}
          <div className="flex h-3 overflow-hidden bg-wash">
            {marks.map((s) => (
              <i key={s.label} className="block h-full border-r-2 border-panel last:border-r-0" style={{ width: `${(s.n / total) * 100}%`, background: COLOR[s.st] }} />
            ))}
          </div>
          {compare && (
            <div className="h-1 overflow-hidden bg-wash">
              <i className="block h-full bg-edge" style={{ width: `${Math.round(Math.min(1, compare.share) * 100)}%` }} />
            </div>
          )}
          {/* the ruler: a fine tick every 5 %, a long one at each quarter */}
          <i className="block h-2.5 opacity-80" style={{ backgroundImage: 'linear-gradient(to right, var(--edge) 1px, transparent 1px), linear-gradient(to right, var(--line) 1px, transparent 1px)', backgroundSize: '25% 10px, 5% 5px', backgroundRepeat: 'repeat-x' }} />
          {/* a ringed marker at each segment's end, on a dashed guide, its count under it */}
          {marks.map((m, i) => (
            <span key={m.label} className="rise-in absolute top-[-6px] bottom-0 grid w-0 justify-items-center" style={{ left: `${m.at * 100}%`, animationDelay: `${120 + i * 70}ms` }}>
              <i className="h-[calc(100%-36px)] w-0 border-l border-dashed border-edge" />
              <i className="-mt-1 grid h-[18px] w-[18px] place-items-center rounded-full border-[1.5px] bg-panel" style={{ borderColor: COLOR[m.st] }}>
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR[m.st] }} />
              </i>
              <span className={`figure mt-0.5 text-[19px]/none whitespace-nowrap ${m.at > 0.9 ? '-translate-x-1/3' : ''}`}>{m.n}</span>
            </span>
          ))}
          {!sum && empty && <p className="pt-1 text-[13.5px]/[1.5] text-dim">{empty}</p>}
        </div>
        <figcaption className="col-span-full flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-[12.5px] text-dim">
          {segs.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2" style={{ background: COLOR[s.st] }} />
              {s.label}
              <b className="font-medium text-text tabular-nums">{s.n}</b>
            </span>
          ))}
          {compare && (
            <span className="inline-flex items-center gap-1.5">
              <i className="h-1 w-4 bg-edge" />
              {compare.label}
            </span>
          )}
        </figcaption>
      </div>
    </figure>
  )
}
