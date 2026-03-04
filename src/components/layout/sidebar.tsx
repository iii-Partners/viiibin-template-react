import { Link, useLocation } from 'react-router'
import { LayoutDashboard, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/app/profile', icon: User },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card md:block">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/app/dashboard" className="font-bold">
          {import.meta.env.VITE_APP_NAME || 'App'}
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
