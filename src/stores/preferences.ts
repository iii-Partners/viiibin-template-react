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
/** How the main views and tools are reached: the header pill across the top, or an icon rail down the left side. For
 *  now Northlight OS uses the rail only; the header pill stays in the code for later. */
export type NavStyle = 'bar' | 'rail'

type PreferencesState = {
  navStyle: NavStyle
  setNavStyle: (navStyle: NavStyle) => void
  /** the ambient light (the edge glow and the cursor aura) on variants that have it */
  ambient: boolean
  setAmbient: (on: boolean) => void
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
  navStyle: 'rail' as NavStyle,
  ambient: true,
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
      setAmbient: (ambient) => set({ ambient }),
      setStateSwitches: (stateSwitches) => set({ stateSwitches }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLocale: (locale) => set({ locale }),
      reset: () => set(defaults),
    }),
    {
      name: 'preferences',
      // version 2: the rail is the only nav for now, so every saved style becomes the rail
      version: 2,
      migrate: (saved) => ({ ...(saved as PreferencesState), navStyle: 'rail' }),
    },
  ),
)
