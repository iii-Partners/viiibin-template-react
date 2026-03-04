import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useUIStore } from '@/stores/ui'

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <div className="flex-1" />
    </header>
  )
}
