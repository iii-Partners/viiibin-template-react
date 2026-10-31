// A card that grows over its set. A Context control on a card grows that card out of its spot until it covers the
// whole set, then fills it with what decides it: why it waits, the facts, and what is related. Close or Esc shrinks it
// back into its spot. The set grows if the context runs taller. Use it where a list of cards (Needs you) needs one
// card's detail without leaving the view.
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Maximize2 } from 'lucide-react'
import { pushLayer, reduced, EASE_RISE } from '@/lib/layers'
import { CloseCue } from '@/components/shell/screen-dialog'

/** The control that opens a card's context. Put it inside the card, which carries `data-grow`. */
export function GrowButton({ count, onOpen }: { count?: number; onOpen(card: HTMLElement): void }) {
  return (
    <button
      type="button"
      data-grow-ctl
      aria-haspopup="dialog"
      onClick={(e) => onOpen(e.currentTarget.closest<HTMLElement>('[data-grow]') ?? e.currentTarget)}
      className="explore !text-[10.5px] text-dim"
    >
      Context{count != null && <span className="tabular-nums">· {count}</span>}
      <Maximize2 className="h-3 w-3" strokeWidth={1.6} aria-hidden="true" />
    </button>
  )
}

/** Which card is open over the set, and from which element. Put `host` on the set's wrapper, which must be relative,
 *  and render `<GrowOver>` inside it while `at` is set. */
export function useGrowOver<K extends string>() {
  const host = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState<{ key: K; from: HTMLElement } | null>(null)
  return { host, at, open: (key: K, from: HTMLElement) => setAt({ key, from }), close: () => setAt(null) }
}

/** Sets one inline style on an element the grow measures (the set, the card it grows from): direct DOM work. */
const setStyle = (el: HTMLElement, prop: string, value: string) => el.style.setProperty(prop, value)

export function GrowOver({ host, from, title, onClose, children }: { host: RefObject<HTMLDivElement | null>; from: HTMLElement; title: string; onClose(): void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const leaving = useRef(false)
  const rectOf = () => {
    const h = host.current!.getBoundingClientRect(), r = from.getBoundingClientRect()
    return { left: `${r.left - h.left}px`, top: `${r.top - h.top}px`, width: `${r.width}px`, height: `${r.height}px` }
  }

  useLayoutEffect(() => {
    const el = box.current!, wrap = host.current!
    const full = Math.max(wrap.offsetHeight, el.offsetHeight)
    setStyle(wrap, 'min-height', `${full}px`)
    setStyle(from, 'visibility', 'hidden')
    el.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true })
    if (!reduced()) {
      el.animate([{ ...rectOf() }, { left: '0px', top: '0px', width: `${wrap.clientWidth}px`, height: `${full}px` }], { duration: 440, easing: EASE_RISE })
      body.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 160, easing: 'ease-out', fill: 'backwards' })
    }
    // a second run (React's dev double effects) must measure the card at rest, not mid-grow
    return () => {
      el.getAnimations().forEach((a) => a.cancel())
      body.current?.getAnimations().forEach((a) => a.cancel())
      setStyle(wrap, 'min-height', '')
      setStyle(from, 'visibility', '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const close = async () => {
    if (leaving.current) return
    leaving.current = true
    const el = box.current!
    if (!reduced()) {
      await body.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' }).finished
      await el.animate([{ left: '0px', top: '0px', width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` }, rectOf()], { duration: 380, easing: EASE_RISE, fill: 'forwards' }).finished
    }
    setStyle(from, 'visibility', '')
    from.querySelector<HTMLElement>('[data-grow-ctl]')?.focus({ preventScroll: true })
    onClose()
  }
  const onEsc = useEffectEvent(() => void close())
  useEffect(() => pushLayer(() => onEsc()), [])

  return (
    <div ref={box} role="dialog" aria-modal="false" aria-label={`Context: ${title}`} className="panel @container absolute inset-x-0 top-0 z-5 min-h-full overflow-hidden !border-edge">
      <div ref={body} className="grid content-start gap-5">
        <div className="flex items-start gap-3">
          <span className="min-w-0 flex-1 pt-1 font-display text-[24px]/[1.2] font-light">{title}</span>
          <CloseCue onClose={() => void close()} />
        </div>
        {children}
      </div>
    </div>
  )
}
