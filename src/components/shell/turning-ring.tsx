// The turning ring: each primary button's gradient ring (--go-ring, in the variants that draw one) turns so its rose
// faces the cursor, as if the button were lit from where you point. It sets --go-angle on every visible .pill.go and
// eases each one the short way round, drawing only while a ring is still turning. Under reduced motion, or without a
// mouse, the rings hold their resting angle (210°). Mounted once, in the providers, so it reaches every page.
import { useEffect } from 'react'

const ease = (cur: number, to: number, dt: number, tau: number) => cur + (to - cur) * (1 - Math.exp(-dt / tau))
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Where the rose sits in the ring (--go-ring's third of six stops, 144° past the start), so it can face the cursor. */
const ROSE = 144

export function TurningRing() {
  useEffect(() => {
    if (reduced() || !matchMedia('(hover: hover)').matches) return
    // each button's angle eases toward its target the short way round, so the ring never spins through a full turn
    const angle = new WeakMap<HTMLElement, number>()
    let target: { x: number; y: number } | null = null, last = 0, raf = 0
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      if (!target) { raf = 0; return }
      // read every rect first, then write, so the page lays out once a frame
      const pills = [...document.querySelectorAll<HTMLElement>('.pill.go')].map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.width && r.bottom > 0 && r.top < innerHeight)
      let moving = false
      for (const { el, r } of pills) {
        const to = (Math.atan2(target.x - (r.left + r.width / 2), (r.top + r.height / 2) - target.y) * 180) / Math.PI - ROSE
        const cur = angle.get(el) ?? to
        const next = ease(cur, cur + ((((to - cur) % 360) + 540) % 360) - 180, dt, 0.14)
        if (Math.abs(next - cur) > 0.05) moving = true
        angle.set(el, next)
        el.style.setProperty('--go-angle', `${next.toFixed(2)}deg`)
      }
      raf = moving ? requestAnimationFrame(frame) : 0
    }
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame) } }
    const onMove = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; target = { x: e.clientX, y: e.clientY }; kick() }
    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      document.querySelectorAll<HTMLElement>('.pill.go').forEach((el) => el.style.removeProperty('--go-angle'))
    }
  }, [])
  return null
}
