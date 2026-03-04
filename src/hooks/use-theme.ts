import { useThemeStore } from '@/stores/theme'

export function useTheme() {
  const { mode, setMode } = useThemeStore()
  return { mode, setMode }
}
