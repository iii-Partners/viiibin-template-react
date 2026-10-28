import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { usePreferencesStore } from './preferences'

/**
 * Preview store — which state a part shows, for the state switches on parts in the live UI.
 *
 * Live is the real data. Happy path shows example data, Empty no data, Loading data on its way, Error data that did
 * not come. A part reads its data through a preview hook (e.g. useItemsFor), so the part renders exactly as it
 * would in that state. Keyed by part, so each switch moves one part.
 *
 * While the switches are on (Settings, a prototype tool), a part opens on its Happy path, so the prototype reads as an
 * app in use. With the switches off, every part shows live data whatever was picked.
 *
 * Persistence: sessionStorage, so a refresh keeps the previews; a new tab starts on the Happy path.
 */
export type PreviewState = 'live' | 'happy' | 'empty' | 'loading' | 'error'

export const PREVIEW_STATES: { id: PreviewState; word: string }[] = [
  { id: 'happy', word: 'Happy' },
  { id: 'empty', word: 'Empty' },
  { id: 'loading', word: 'Loading' },
  { id: 'error', word: 'Error' },
  { id: 'live', word: 'Live' },
]

type PreviewStore = {
  parts: Record<string, PreviewState>
  set: (part: string, state: PreviewState) => void
}

export const usePreview = create<PreviewStore>()(
  persist(
    (set) => ({
      parts: {},
      set: (part, state) => set((s) => ({ parts: { ...s.parts, [part]: state } })),
    }),
    { name: 'preview', storage: createJSONStorage(() => sessionStorage) },
  ),
)

/** The state a part shows. The part named 'live' always reads live data. */
export function usePreviewOf(part: string): PreviewState {
  const on = usePreferencesStore((s) => s.stateSwitches)
  const picked = usePreview((s) => s.parts[part])
  return on && part !== 'live' ? (picked ?? 'happy') : 'live'
}
