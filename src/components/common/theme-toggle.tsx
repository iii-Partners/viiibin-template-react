import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/theme'

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore()

  const cycleTheme = () => {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
    setMode(next)
  }

  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme}>
      <Icon className="h-4 w-4" />
      <span className="sr-only">Toggle theme ({mode})</span>
    </Button>
  )
}
