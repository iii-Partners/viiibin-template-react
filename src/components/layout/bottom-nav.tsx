import { Link, useLocation } from 'react-router'
import { LayoutDashboard, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/app/profile', icon: User },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card pb-safe md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
