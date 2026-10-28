import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CATALOG, SPEC_STATES } from '@/design/catalog'

// Every part of the design system renders in every state. A part joins the catalog with all four or not at all.
describe('Design system catalog', () => {
  it('has an import and a use for every part, and unique ids', () => {
    expect(new Set(CATALOG.map((s) => s.id)).size).toBe(CATALOG.length)
    for (const s of CATALOG) {
      expect(s.from.length).toBeGreaterThan(0)
      expect(s.use.length).toBeGreaterThan(0)
    }
  })

  for (const spec of CATALOG) {
    for (const st of SPEC_STATES) {
      it(`${spec.name}: ${st.word}`, () => {
        const { container } = render(<>{spec.states[st.id]()}</>)
        // a state shows words, or (loading) the busy shape of what is coming
        const said = (container.textContent?.trim().length ?? 0) > 0
        const busy = !!container.querySelector('[aria-busy="true"]')
        expect(st.id === 'loading' ? said || busy : said).toBe(true)
      })
    }
  }
})
