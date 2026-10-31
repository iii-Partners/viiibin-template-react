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
    <div className={cn('grid justify-items-start gap-4 border border-dashed border-edge/60 px-6 py-6', className)}>
      <span className="grid h-10 w-10 place-items-center rounded-full border border-edge text-text">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="grid gap-1.5">
        <b className="font-display text-[22px]/[1.2] font-light">{title}</b>
        {children && <div className="max-w-[56ch] text-[14px]/[1.55] text-dim">{children}</div>}
      </div>
      {action}
    </div>
  )
}

/** An in-line note where a list or a chart has nothing to show yet. */
export function Blank({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('border border-dashed border-line px-4 py-3 text-[13.5px]/[1.5] text-dim', className)}>{children}</p>
}

/** Loading: the shape of what is coming, so the view does not jump when it lands. */
export function Pending({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('grid gap-2.5', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="grid gap-2 border-t border-line pt-3 first:border-t-0 first:pt-0">
          <i className="h-3.5 w-1/3 animate-pulse bg-wash" />
          <i className="h-3 w-2/3 animate-pulse bg-wash" style={{ animationDelay: `${i * 120}ms` }} />
        </span>
      ))}
    </div>
  )
}

/** The broken track: the system's hairline, running from the left, cut where the signal stopped, then dashed where no
 *  reading came. Drawn in the part's own vocabulary, so a failure reads as part of the design, not an alarm. */
function BrokenTrack() {
  return (
    <svg viewBox="0 0 320 24" className="h-6 w-full max-w-[320px]" aria-hidden="true">
      <line x1="0" y1="12" x2="118" y2="12" className="stroke-text" strokeWidth="2" />
      <path d="M126 4l-6 16M138 4l-6 16" className="stroke-fault" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="146" y1="12" x2="320" y2="12" className="stroke-edge" strokeWidth="2" strokeDasharray="2 7" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={i * 14} y1="19" x2={i * 14} y2={i % 4 === 0 ? 24 : 22} className="stroke-line" strokeWidth="1" />
      ))}
    </svg>
  )
}

/** A failure, designed: the part keeps its frame (its code and name, when it has them), a broken track where its
 *  reading would be, the blocked status word naming what failed, one sentence on why and what to do, and a retry.
 *  Coral marks only the word and the break. Nothing behind it is shown as zero or empty, because nothing was read. */
export function Failed({ title, detail, onRetry, code, label, className }: { title: string; detail?: string; onRetry?(): void; code?: string; label?: string; className?: string }) {
  return (
    <div role="alert" className={cn('panel grid justify-items-start gap-4', className)}>
      {(code || label) && (
        <span className="flex items-baseline gap-2.5">
          {code && <code className="font-mono text-[11.5px]/none tracking-[0.04em] text-dim">{code}</code>}
          {label && <span className="eyebrow">{label}</span>}
        </span>
      )}
      <BrokenTrack />
      <span className="st blocked">{title}</span>
      {detail && <p className="max-w-[60ch] text-[14px]/[1.55] text-dim">{detail}</p>}
      {onRetry && (
        <button type="button" className="pill sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

/** A card-sized part (a chart, a panel) while its data loads: its code and label stay, its body pulses. */
export function PendingCard({ code, label, rows = 2 }: { code?: string; label: string; rows?: number }) {
  return (
    <div className="panel grid gap-5" aria-busy="true">
      <span className="flex items-baseline gap-2.5">
        {code && <code className="font-mono text-[11.5px]/none tracking-[0.04em] text-dim">{code}</code>}
        <span className="eyebrow ink">{label}</span>
      </span>
      <Pending rows={rows} />
    </div>
  )
}
