// The layer stack. Every dialog, grown card and confirm is a layer over what is under it; Esc closes the top layer
// only, so a confirm over a screen over a view steps back one layer at a time. A layer registers its close when it
// opens and removes it when it closes.
const stack: { close: () => void }[] = []

export function pushLayer(close: () => void): () => void {
  const entry = { close }
  stack.push(entry)
  return () => {
    const i = stack.indexOf(entry)
    if (i >= 0) stack.splice(i, 1)
  }
}

export const layerDepth = () => stack.length

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !stack.length) return
    e.preventDefault()
    stack[stack.length - 1].close()
  })
}

// Motion helpers. Every transition moves only transform and opacity; under reduced motion each view arrives at its end
// state at once.
export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
export const EASE_OPEN = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

