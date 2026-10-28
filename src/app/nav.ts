// The main views. Each is a wedge in the header bar (or a button on the rail); everything under them opens as a screen
// (a dialog) over the view it came from. Add a main view here and as a route in router.tsx; add a child view as a
// screen in app/screens. With the rail, the places the rail reaches (RAIL_VIEWS) are views too.
import { Database, LayoutDashboard, type LucideIcon } from 'lucide-react'

export type MainView = { id: string; name: string; path: string; icon: LucideIcon }

export const MAIN_VIEWS: MainView[] = [
  { id: 'dashboard', name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { id: 'items', name: 'Items', path: '/app/items', icon: Database },
]

/** The places the rail reaches beside the main views. With the rail they are views, each at its own route; with the
 *  wedge bar they open as screens over the view. Everything else (a record, a confirm) is always a screen. */
export type RailView = 'dial' | 'design' | 'profile' | 'settings'
export const RAIL_VIEWS: Record<RailView, string> = {
  dial: '/app/birds-eye',
  design: '/app/design',
  profile: '/app/profile',
  settings: '/app/settings',
}
export const isRailView = (id: string): id is RailView => id in RAIL_VIEWS
