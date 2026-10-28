// A confirm: the smallest layer. It sits over whatever is open (a view, a screen, a screen over a screen), blurs it,
// and asks one question as a folder card. Cancel answers no, so it carries no Close of its own; Esc answers no too.
// `confirm()` returns the answer.
import { useEffect, useEffectEvent, useRef } from 'react'
import { create } from 'zustand'
import { pushLayer } from '@/lib/layers'
import { useFocusTrap } from '@/hooks/use-focus-trap'

type Ask = { title: string; body?: string; action: string; risky?: boolean; done(yes: boolean): void }

const useAsk = create<{ ask: Ask | null }>(() => ({ ask: null }))

export function confirm(q: Omit<Ask, 'done'>): Promise<boolean> {
  return new Promise((done) => useAsk.setState({ ask: { ...q, done } }))
}

export function ConfirmHost() {
  const ask = useAsk((s) => s.ask)
  return ask ? <ConfirmLayer key={ask.title} ask={ask} /> : null
}

function ConfirmLayer({ ask }: { ask: Ask }) {
  const box = useRef<HTMLDivElement>(null)
  const opener = useRef(document.activeElement as HTMLElement | null)
  useFocusTrap(box)
  const answer = (yes: boolean) => {
    useAsk.setState({ ask: null })
    ask.done(yes)
    opener.current?.focus({ preventScroll: true })
  }
  const onEsc = useEffectEvent(() => answer(false))
  useEffect(() => {
    const pop = pushLayer(() => onEsc())
    box.current?.querySelector<HTMLElement>('[data-default]')?.focus()
    return pop
  }, [])
  return (
    <div ref={box} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="surface fixed inset-0 z-[40] grid place-items-center px-safe">
      <div className="gm-folder w-full max-w-[440px] px-5 pb-5 [--fold-pt:10px]" style={{ animation: 'zin 260ms var(--ease-open) both' }}>
        <div className="grid gap-3">
          <h2 id="confirm-title" className="pt-1 text-[20px]/[1.3]">
            {ask.title}
          </h2>
          {ask.body && <p className="text-[14px]/[1.55] text-dim">{ask.body}</p>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" data-default className="gm-btn" onClick={() => answer(false)}>
              Cancel
            </button>
            <button type="button" className={ask.risky ? 'gm-btn !border-fault !text-fault hover:!text-white' : 'gm-btn go'} onClick={() => answer(true)}>
              {ask.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
