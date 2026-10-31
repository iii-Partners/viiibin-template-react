// A screen as a dialog over the main view, after the deck's "more" dialogs: a pane of frosted glass sized to its
// content, up to 90 % of the window, over a veil that blurs and tints the view. The veil fades in and the pane rises
// 12 px; its parts arrive in reading order. Close or Esc reverses it: the pane sinks and fades with the veil, and focus
// returns to the door the viewer pressed. A press on the veil does nothing, so nothing behind a dialog takes a click.
// Each screen opened from a screen layers over it and blurs it in turn.
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { pushLayer, reduced } from '@/lib/layers'
import { doorOf, useScreens, type OpenScreen } from '@/stores/screens'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { StatusWord, type Status } from '@/components/system/status'

export type ScreenHead = { kind: string; title: string; st?: Status; word?: string }

/** The cue on every Close: the button names itself in a tracked word, the Esc tag beside it says the key does the
 *  same, and the X sits in a round button that fills with the ink when pointed at. */
export function CloseCue({ onClose, label = 'Close' }: { onClose(): void; label?: string }) {
  return (
    <button type="button" data-close onClick={onClose} className="group inline-flex flex-none items-center gap-2.5 rounded-full focus-visible:outline-none">
      <span className="eyebrow ink max-[480px]:sr-only">{label}</span>
      <span aria-hidden="true" className="border border-line px-1.5 py-[3px] font-mono text-[10px]/none tracking-[0.04em] text-dim max-[480px]:hidden">
        Esc
      </span>
      <span aria-hidden="true" className="round group-hover:border-text group-hover:bg-text group-hover:text-ground group-focus-visible:border-text group-focus-visible:bg-text group-focus-visible:text-ground group-focus-visible:shadow-[0_0_0_2px_var(--focus)]">
        <X size={17} strokeWidth={1.5} />
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
    if (!reduced()) await new Promise((r) => setTimeout(r, 280))
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
      className={`veil fixed inset-0 grid place-items-center p-[clamp(8px,3vw,40px)] ${phase === 'out' ? 'out' : ''}`}
    >
      <div className="sheet flex max-h-[min(90dvh,100%)] w-[min(100%,1180px)] flex-col overflow-hidden">
        {/* the title on the left, the status then Close on the right; on a phone the title takes its own row under
            them, so it is never squeezed */}
        <header className="grid flex-none grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-5 gap-y-3 px-[clamp(20px,4vw,52px)] pt-[clamp(20px,4vh,44px)] pb-5 max-[560px]:grid-cols-[minmax(0,1fr)_auto]">
          <span className="col-start-3 row-start-1 justify-self-end max-[560px]:col-start-2">
            <CloseCue onClose={() => void leave()} />
          </span>
          <div className="col-start-1 row-start-1 grid min-w-0 gap-2 max-[560px]:col-span-full max-[560px]:row-start-2">
            <small className="eyebrow">{head.kind}</small>
            <h1 id={`${entry.key}-title`} className="text-[44px]/[1.05] max-[560px]:text-[32px]">
              {head.title}
            </h1>
          </div>
          {head.st && (
            <StatusWord st={head.st} className="col-start-2 row-start-1 max-w-full justify-self-end whitespace-normal max-[560px]:col-start-1 max-[560px]:justify-self-start">
              {head.word}
            </StatusWord>
          )}
        </header>
        <section className="@container/frame arrive grid min-h-0 flex-1 content-start gap-5 overflow-y-auto px-[clamp(20px,4vw,52px)] pt-2 pb-[clamp(24px,5vh,52px)]">
          {children}
        </section>
      </div>
    </div>
  )
}
