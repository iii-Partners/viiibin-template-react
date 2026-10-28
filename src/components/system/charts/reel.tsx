// The reel's paired track, after Fleet Command's graphs reel: a large figure in Rajdhani with its label, then the
// reading as one track cut into segments by status, a thin comparison track under it, and a ringed marker on a dashed
// guide at each segment's end, its count beside it. Status keeps its own color, and the legend sets each color beside
// its word. Built in HTML so the rings stay round at any width. With nothing counted yet, the track stays empty, the
// legend still names every segment at zero, and `empty` says what will fill it.
import type { ReactNode } from 'react'
import { STATUS_VAR, type Status } from '../status'

export type ReelTone = Status | 'quiet'
const COLOR: Record<ReelTone, string> = { ...STATUS_VAR, quiet: 'var(--teal)' }

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
    <figure className="gm-tabcard m-0" aria-label={`${label}: ${big}. ${segs.map((s) => `${s.label} ${s.n}`).join(', ')}.${compare ? ` ${compare.label}.` : ''}`}>
      <div className="gm-tabcard-body grid grid-cols-[minmax(150px,200px)_minmax(0,1fr)] items-center gap-x-6 gap-y-3 px-5 pt-3 pb-5 @max-[700px]/frame:grid-cols-1">
        <div className="grid gap-1">
          <code className="font-mono text-[11px]/none font-medium tracking-[0.04em] text-brand">[{code}]</code>
          <b className="font-figure text-[56px]/[0.95] font-medium tabular-nums">{big}</b>
          <span className="text-[14px]/[1.3] font-medium">{label}</span>
          {meta && <span className="text-[12.5px]/[1.35] text-dim">{meta}</span>}
        </div>
        <div className={`relative mr-2 grid gap-2 pt-1 ${sum ? 'pb-10' : 'pb-1'}`} aria-hidden="true">
          {/* the reading: one track cut by status */}
          <div className="flex h-3.5 overflow-hidden rounded-chip border-2 border-line bg-glass-raised">
            {marks.map((s) => (
              <i key={s.label} className="block h-full border-r-2 border-glass last:border-r-0" style={{ width: `${(s.n / total) * 100}%`, background: COLOR[s.st] }} />
            ))}
          </div>
          {compare && (
            <div className="h-1.5 overflow-hidden rounded-chip bg-glass-raised">
              <i className="block h-full bg-teal" style={{ width: `${Math.round(Math.min(1, compare.share) * 100)}%` }} />
            </div>
          )}
          {/* the ruler: a fine tick every 5 %, a long one at each quarter */}
          <i className="block h-2.5 opacity-80" style={{ backgroundImage: 'linear-gradient(to right, var(--teal) 1px, transparent 1px), linear-gradient(to right, var(--line) 1px, transparent 1px)', backgroundSize: '25% 10px, 5% 5px', backgroundRepeat: 'repeat-x' }} />
          {/* a ringed marker at each segment's end, on a dashed guide, its count under it */}
          {marks.map((m, i) => (
            <span key={m.label} className="rise-in absolute top-[-6px] bottom-0 grid w-0 justify-items-center" style={{ left: `${m.at * 100}%`, animationDelay: `${120 + i * 70}ms` }}>
              <i className="h-[calc(100%-34px)] w-0 border-l border-dashed border-teal" />
              <i className="-mt-1 grid h-[18px] w-[18px] place-items-center rounded-full border-2 bg-glass" style={{ borderColor: COLOR[m.st] }}>
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR[m.st] }} />
              </i>
              <span className={`mt-0.5 font-figure text-[15px]/none font-medium whitespace-nowrap tabular-nums ${m.at > 0.9 ? '-translate-x-1/3' : ''}`}>{m.n}</span>
            </span>
          ))}
          {!sum && empty && <p className="pt-1 text-[13px]/[1.45] text-dim">{empty}</p>}
        </div>
        <figcaption className="col-span-full flex flex-wrap gap-x-4 gap-y-1 border-t-2 border-line pt-2.5 text-[12.5px] text-dim">
          {segs.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-[1px]" style={{ background: COLOR[s.st] }} />
              {s.label}
              <b className="font-figure text-[14px] font-medium text-text tabular-nums">{s.n}</b>
            </span>
          ))}
          {compare && (
            <span className="inline-flex items-center gap-1.5">
              <i className="h-1.5 w-4 rounded-chip bg-teal" />
              {compare.label}
            </span>
          )}
        </figcaption>
      </div>
    </figure>
  )
}
