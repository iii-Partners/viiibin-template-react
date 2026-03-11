import { Link, useLocation } from 'react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { LayoutDashboard, Settings, User, Database, LogOut, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { isAuthEnabled } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Items', href: '/app/items', icon: Database },
  { label: 'Profile', href: '/app/profile', icon: User },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

function UserMenu() {
  if (!isAuthEnabled) {
    return (
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-1 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs text-muted-foreground">Demo Mode</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          asChild
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    )
  }

  const { user, isAuthenticated, logout } = useAuth0()

  if (!isAuthenticated || !user) return null

  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-3 px-1 pb-3">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || 'User avatar'}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-destructive"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  )
}

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/" className="text-lg font-semibold">
          {import.meta.env.VITE_APP_NAME || 'App'}
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
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
      <UserMenu />
    </aside>
  )
}
