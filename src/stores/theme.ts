import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

function applyTheme(mode: ThemeMode) {
  const isDark =
    mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
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
      name: 'theme-preference',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode)
      },
    },
  ),
)
