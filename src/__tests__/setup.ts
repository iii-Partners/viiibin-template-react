import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// each test starts from an empty document (vitest runs without globals, so Testing Library cannot clean up itself)
afterEach(() => cleanup())

// jsdom has no layout observers or media queries; the design system's charts and dialogs measure with them. The
// Functions tests run in node, with no window at all.
if (typeof window !== 'undefined') {
  if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) as MediaQueryList
  }
}
