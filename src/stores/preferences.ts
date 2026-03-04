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
type PreferencesState = {
  notificationsEnabled: boolean
  reducedMotion: boolean
  locale: string
  setNotificationsEnabled: (enabled: boolean) => void
  setReducedMotion: (reduced: boolean) => void
  setLocale: (locale: string) => void
  reset: () => void
}

const defaults = {
  notificationsEnabled: true,
  reducedMotion: false,
  locale: 'en',
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLocale: (locale) => set({ locale }),
      reset: () => set(defaults),
    }),
    { name: 'preferences' },
  ),
)
