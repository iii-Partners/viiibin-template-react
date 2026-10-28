// A screen as a dialog over the main view. The blur fades in over the view and the screen's parts arrive in reading
// order. Close or Esc reverses it: the parts and the blur fade, and focus returns to the door the viewer pressed. A
// press on the blur does nothing, so nothing behind a dialog takes a click. Each screen opened from a screen layers
// over it and blurs it in turn.
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { pushLayer, reduced } from '@/lib/layers'
import { doorOf, useScreens, type OpenScreen } from '@/stores/screens'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { StatusWord, type Status } from '@/components/system/status'

export type ScreenHead = { kind: string; title: string; st?: Status; word?: string }

/** The cue on every Close: the button names itself, and the Esc tag beside it says the key does the same. */
export function CloseCue({ onClose, label = 'Close' }: { onClose(): void; label?: string }) {
  return (
    <button
      type="button"
      data-close
      onClick={onClose}
      className="inline-flex items-center gap-2 rounded-base border border-teal bg-glass px-3 py-2 text-[12.5px]/none font-semibold tracking-[0.02em] transition-colors duration-(--dur-hover) hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent focus-visible:outline-none"
    >
      <X className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
      <span aria-hidden="true" className="rounded-chip border border-line px-1 py-[2px] font-mono text-[10px]/none font-medium tracking-[0.04em] text-dim">
        Esc
      </span>
    </button>
  )
}

export function ScreenDialog({ entry, depth, head, children }: { entry: OpenScreen; depth: number; head: ScreenHead; children: ReactNode }) {
  const close = useScreens((s) => s.close)
  const veil = useRef<HTMLDivElement>(null)
  // in: the parts arrive; out: they and the blur fade
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const leaving = useRef(false)
  useFocusTrap(veil)

  const leave = async () => {
    if (leaving.current) return
    leaving.current = true
    const door = doorOf(entry.key)
    setPhase('out')
    if (!reduced()) await new Promise((r) => setTimeout(r, 220))
    close(entry.key)
    if (door instanceof HTMLElement && door.isConnected) door.focus({ preventScroll: true })
  }
  const onEsc = useEffectEvent(() => void leave())

  useEffect(() => {
    const pop = pushLayer(() => onEsc())
    veil.current?.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true })
    return pop
  }, [])

  return (
    <div
      ref={veil}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${entry.key}-title`}
      style={{ zIndex: 14 + depth * 2 }}
      className={`surface @container/frame fixed inset-0 overflow-y-auto ${phase === 'out' ? 'surface-out' : ''}`}
    >
      <section
        className={`mx-auto grid min-h-full max-w-[1240px] content-start gap-4 px-safe pt-[clamp(24px,5vh,56px)] pb-16 ${
          phase === 'out' ? 'opacity-0 transition-opacity duration-160 ease-in' : 'arrive'
        }`}
      >
        {/* the title on the left, the status then Close on the right; on a phone the title takes its own row under
            them, so it is never squeezed */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-2.5 border-b border-line pb-3">
          <span className="col-start-3 row-start-1 justify-self-end">
            <CloseCue onClose={() => void leave()} />
          </span>
          <div className="col-start-1 row-start-1 grid min-w-0 gap-0.5 @max-[560px]/frame:col-span-full @max-[560px]/frame:row-start-2">
            <small className="text-[11.5px]/[1.3] font-semibold tracking-[0.1em] text-dim uppercase">{head.kind}</small>
            <h1 id={`${entry.key}-title`} className="text-[28px]/[1.15] text-balance @max-[560px]/frame:text-[24px]">
              {head.title}
            </h1>
          </div>
          {head.st && (
            <StatusWord st={head.st} className="col-start-2 row-start-1 max-w-full justify-self-end whitespace-normal @max-[560px]/frame:col-start-1 @max-[560px]/frame:justify-self-start">
              {head.word}
            </StatusWord>
          )}
        </header>
        {children}
      </section>
    </div>
  )
}
