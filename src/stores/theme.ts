import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Theme store — dark/light/system mode preference.
 *
 * Persistence: localStorage (survives sessions)
 * Hydration: 1st (must apply before first paint to avoid flash)
 */
type ThemeMode = 'light' | 'dark' | 'system'

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

// Apply theme immediately on import to prevent flash
const stored = globalThis.localStorage?.getItem('theme')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    if (parsed?.state?.mode) applyTheme(parsed.state.mode)
  } catch {
    // ignore
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => {
        applyTheme(mode)
        set({ mode })
      },
    }),
    {
      name: 'theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode)
      },
    },
  ),
)
