// The main views of Northlight OS, grouped by who they serve: operations (Today, Guests, Retreats), the clinical team
// (Reviews, Care), the guest (Portal), and the Blueprint that ties the OS back to the documents. Each is a button on
// the rail; everything under them (a guest, a retreat, a step) opens as a screen over the view. Add a main view here
// and as a route in router.tsx; add a child view as a screen in app/screens. The places the rail also reaches
// (RAIL_VIEWS) are views too.
import { BedDouble, HeartHandshake, Leaf, Map, Stethoscope, Sunrise, Users, type LucideIcon } from 'lucide-react'

export type ViewGroup = 'Operations' | 'Clinical' | 'Guest' | 'Blueprint'
export type MainView = { id: string; name: string; path: string; icon: LucideIcon; group: ViewGroup }

export const MAIN_VIEWS: MainView[] = [
  { id: 'today', name: 'Today', path: '/app/today', icon: Sunrise, group: 'Operations' },
  { id: 'guests', name: 'Guests', path: '/app/guests', icon: Users, group: 'Operations' },
  { id: 'retreats', name: 'Retreats', path: '/app/retreats', icon: BedDouble, group: 'Operations' },
  { id: 'reviews', name: 'Medical reviews', path: '/app/reviews', icon: Stethoscope, group: 'Clinical' },
  { id: 'care', name: 'Sessions and care', path: '/app/care', icon: HeartHandshake, group: 'Clinical' },
  { id: 'portal', name: 'Guest portal', path: '/app/portal', icon: Leaf, group: 'Guest' },
  { id: 'blueprint', name: 'Blueprint', path: '/app/blueprint', icon: Map, group: 'Blueprint' },
]
export const VIEW_GROUPS: ViewGroup[] = ['Operations', 'Clinical', 'Guest', 'Blueprint']

/** The places the rail reaches beside the main views. With the rail they are views, each at its own route; with the
 *  header pill they open as screens over the view. Everything else (a guest, a confirm) is always a screen. */
export type RailView = 'design' | 'profile' | 'settings'
export const RAIL_VIEWS: Record<RailView, string> = {
  design: '/app/design',
  profile: '/app/profile',
  settings: '/app/settings',
}
export const isRailView = (id: string): id is RailView => id in RAIL_VIEWS
