// A whole and its parts: the whole as a Rajdhani figure, one track cut into its parts in shades of the one accent
// (largest darkest), then a row a part with its share on its own track, a ringed marker at its end, and its figure.
// A part with a status takes that status's color. With no parts yet, the figure reads zero and `empty` says what the
// parts will be.
import type { ReactNode } from 'react'
import { STATUS_VAR, type Status } from '../status'

export interface FanPart {
  name: string
  /** the figure beside the row, e.g. "$420" */
  value: string
  /** what the figure means, under it */
  note?: string
  /** the part's share of the whole, 0 to 1 */
  share: number
  st?: Status
}

const shade = (i: number, n: number) => `color-mix(in srgb, var(--brand) ${Math.round(100 - (i / Math.max(1, n - 1)) * 70)}%, var(--glass-raised))`

export function Fan({ label, total, totalLabel, sub, parts, empty }: { label: string; total: string; totalLabel: string; sub?: string; parts: FanPart[]; empty?: ReactNode }) {
  const rows = parts.map((p, i) => ({ ...p, share: Math.max(0, Math.min(1, p.share)), fill: p.st ? STATUS_VAR[p.st] : shade(i, parts.length) }))
  const sum = rows.reduce((a, p) => a + p.share, 0) || 1
  return (
    <figure className="m-0 grid gap-4" aria-label={`${label}: ${totalLabel} ${total}. ${rows.map((p) => `${p.name} ${p.value}`).join('; ')}.`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <b className="font-figure text-[48px]/none font-medium tabular-nums">{total}</b>
        <span className="grid gap-0.5">
          <span className="text-[14px] font-medium">{totalLabel}</span>
          {sub && <span className="text-[12.5px] text-dim">{sub}</span>}
        </span>
      </div>
      <span className="flex h-3.5 overflow-hidden rounded-chip bg-glass-raised" aria-hidden="true">
        {rows.map((p, i) => (
          <i key={p.name} className="rise-in block h-full border-r-2 border-glass last:border-r-0" style={{ width: `${(p.share / sum) * 100}%`, background: p.fill, animationDelay: `${i * 60}ms` }} />
        ))}
      </span>
      {rows.length ? (
        <ol className="m-0 grid list-none gap-3 border-t-2 border-line p-0 pt-3" aria-hidden="true">
          {rows.map((p) => (
            <li key={p.name} className="grid grid-cols-[minmax(96px,170px)_minmax(0,1fr)_84px] items-center gap-x-4">
              <span className="flex min-w-0 items-center gap-2">
                <i className="h-2.5 w-2.5 flex-none rounded-[1px]" style={{ background: p.fill }} />
                <span className="truncate text-[13px] font-medium">{p.name}</span>
              </span>
              <span className="relative h-[26px]">
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-chip bg-glass-raised" />
                <span className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-chip" style={{ width: `${p.share * 100}%`, background: p.fill }} />
                <span className="absolute top-1/2 flex w-0 -translate-y-1/2 justify-center" style={{ left: `${p.share * 100}%` }}>
                  <i className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-2 bg-glass" style={{ borderColor: p.fill }}>
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: p.fill }} />
                  </i>
                </span>
              </span>
              <span className="grid justify-items-end">
                <b className="font-figure text-[22px]/none font-medium tabular-nums">{p.value}</b>
                {p.note && <span className="text-[11.5px] text-dim tabular-nums">{p.note}</span>}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        empty && <p className="border-t-2 border-line pt-3 text-[13px]/[1.45] text-dim">{empty}</p>
      )}
    </figure>
  )
}
