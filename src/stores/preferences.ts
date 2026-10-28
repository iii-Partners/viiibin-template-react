import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Preferences store — user-configurable settings.
 *
 * Persistence: localStorage (survives sessions)
 * Hydration: 3rd (non-blocking)
 *
 * For user profile data (name, email, avatar), use TanStack Query.
 * This store is for client-side preferences only.
 */
/** How the main views and tools are reached: the wedge bar across the top, or an icon rail down the left side. */
export type NavStyle = 'wedges' | 'rail'

type PreferencesState = {
  navStyle: NavStyle
  setNavStyle: (navStyle: NavStyle) => void
  /** the small state switches on parts in the live UI (a prototype tool) */
  stateSwitches: boolean
  setStateSwitches: (on: boolean) => void
  notificationsEnabled: boolean
  reducedMotion: boolean
  locale: string
  setNotificationsEnabled: (enabled: boolean) => void
  setReducedMotion: (reduced: boolean) => void
  setLocale: (locale: string) => void
  reset: () => void
}

const defaults = {
  navStyle: 'wedges' as NavStyle,
  stateSwitches: import.meta.env.DEV,
  notificationsEnabled: true,
  reducedMotion: false,
  locale: 'en',
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      setNavStyle: (navStyle) => set({ navStyle }),
      setStateSwitches: (stateSwitches) => set({ stateSwitches }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLocale: (locale) => set({ locale }),
      reset: () => set(defaults),
    }),
    { name: 'preferences' },
  ),
)
