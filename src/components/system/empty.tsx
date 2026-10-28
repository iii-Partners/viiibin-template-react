// The default views for a place with nothing in it yet. A fresh view still holds value: it says what will appear
// here, why it matters, and offers the one action that fills it. `Empty` is the card-sized default; `Blank` is the
// in-line one for a chart or a list inside a card. Loading and failure have their own defaults, so no view is ever a
// spinner alone or a bare error.
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/** A fresh place: what will show here, and the first step. */
export function Empty({ icon: Icon, title, children, action, className }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('grid justify-items-start gap-3 rounded-card border border-dashed border-teal/70 px-5 py-5', className)}>
      <span className="grid h-10 w-10 place-items-center rounded-tile bg-glass-raised text-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="grid gap-1">
        <b className="text-[15px]/[1.3] font-semibold">{title}</b>
        {children && <div className="max-w-[56ch] text-[13.5px]/[1.5] text-dim">{children}</div>}
      </div>
      {action}
    </div>
  )
}

/** An in-line note where a list or a chart has nothing to show yet. */
export function Blank({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('rounded-tile border border-dashed border-line px-3 py-2.5 text-[13px]/[1.45] text-dim', className)}>{children}</p>
}

/** Loading: the shape of what is coming, so the view does not jump when it lands. */
export function Pending({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('grid gap-2.5', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="grid gap-1.5 border-t border-line pt-2.5">
          <i className="h-3.5 w-1/3 animate-pulse rounded-chip bg-glass-raised" />
          <i className="h-3 w-2/3 animate-pulse rounded-chip bg-glass-raised" style={{ animationDelay: `${i * 120}ms` }} />
        </span>
      ))}
    </div>
  )
}

/** The broken track: the system's rail, running from the left, cut where the signal stopped, then dashed where no
 *  reading came. Drawn in the part's own vocabulary, so a failure reads as part of the design, not an alarm. */
function BrokenTrack() {
  return (
    <svg viewBox="0 0 320 24" className="h-6 w-full max-w-[320px]" aria-hidden="true">
      <line x1="0" y1="12" x2="118" y2="12" className="stroke-teal" strokeWidth="3" strokeLinecap="round" />
      <path d="M126 4l-6 16M138 4l-6 16" className="stroke-fault" strokeWidth="2" strokeLinecap="round" />
      <line x1="146" y1="12" x2="320" y2="12" className="stroke-line" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={i * 14} y1="19" x2={i * 14} y2={i % 4 === 0 ? 24 : 22} className="stroke-line" strokeWidth="1" />
      ))}
    </svg>
  )
}

/** A failure, designed: the part keeps its frame (its code and name, when it has them), a broken track where its
 *  reading would be, the blocked status word naming what failed, one sentence on why and what to do, and a retry.
 *  Red marks only the word and the break. Nothing behind it is shown as zero or empty, because nothing was read. */
export function Failed({ title, detail, onRetry, code, label, className }: { title: string; detail?: string; onRetry?(): void; code?: string; label?: string; className?: string }) {
  return (
    <div role="alert" className={cn('gm-tabcard min-w-0', className)}>
      <div className="gm-tabcard-body grid justify-items-start gap-3 px-5 pt-3 pb-5">
        {(code || label) && (
          <span className="grid gap-1">
            {code && <code className="font-mono text-[11px]/none font-medium tracking-[0.04em] text-dim">[{code}]</code>}
            {label && <span className="text-[14px] font-medium text-dim">{label}</span>}
          </span>
        )}
        <BrokenTrack />
        <span className="st blocked">{title}</span>
        {detail && <p className="max-w-[60ch] text-[13.5px]/[1.5] text-dim">{detail}</p>}
        {onRetry && (
          <button type="button" className="gm-btn !px-3.5 !py-2 !text-[12.5px]" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

/** A card-sized part (a chart, a panel) while its data loads: its code and label stay, its body pulses. */
export function PendingCard({ code, label, rows = 2 }: { code?: string; label: string; rows?: number }) {
  return (
    <div className="gm-tabcard" aria-busy="true">
      <div className="gm-tabcard-body grid gap-3 px-5 pt-3 pb-5">
        <span className="grid gap-1">
          {code && <code className="font-mono text-[11px]/none font-medium tracking-[0.04em] text-brand">[{code}]</code>}
          <span className="text-[14px] font-medium">{label}</span>
        </span>
        <Pending rows={rows} />
      </div>
    </div>
  )
}
