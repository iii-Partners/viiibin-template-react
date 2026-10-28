import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Screens store — the dialogs open over the main view.
 *
 * Only the main views have routes. Everything under them (a record, the profile, settings) opens as a screen: a
 * dialog over the view, opened from a door. A screen opened from a screen layers over it, and
 * Close or Esc steps back one layer at a time.
 *
 * Persistence: sessionStorage, so a refresh keeps what is open; a new tab starts fresh.
 */
export type ScreenId = 'profile' | 'settings' | 'item' | 'design' | 'dial'

export type OpenScreen = {
  /** unique per opening, so the same screen can sit twice in the stack */
  key: string
  id: ScreenId
  params?: Record<string, string | number>
}

type ScreensState = {
  stack: OpenScreen[]
  open: (id: ScreenId, params?: OpenScreen['params'], from?: Element | null) => void
  close: (key: string) => void
  closeAll: () => void
}

// The door each screen opened from, so Close can hand focus back to it. Elements stay out of the persisted state.
const doors = new Map<string, Element>()
export const doorOf = (key: string) => doors.get(key) ?? null

export const useScreens = create<ScreensState>()(
  persist(
    (set) => ({
      stack: [],
      open: (id, params, from) => {
        const key = `${id}-${Date.now().toString(36)}`
        const door = from?.closest('[data-door]') ?? from
        if (door) doors.set(key, door)
        set((s) => ({ stack: [...s.stack, { key, id, params }] }))
      },
      close: (key) => {
        doors.delete(key)
        set((s) => ({ stack: s.stack.filter((x) => x.key !== key) }))
      },
      closeAll: () => {
        doors.clear()
        set({ stack: [] })
      },
    }),
    { name: 'screens', storage: createJSONStorage(() => sessionStorage) },
  ),
)

/** Opens a screen from the element the viewer pressed. */
export const openScreen = (id: ScreenId, params?: OpenScreen['params'], from?: Element | null) =>
  useScreens.getState().open(id, params, from)
