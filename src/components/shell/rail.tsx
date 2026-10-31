// The rail: Northlight OS's navigation, after the deck's chapter rail. One capsule of dark, frosted ink down the left
// edge, inside the safe margin: the views by audience (operations, clinical, the guest, the blueprint), each group set
// off by a hairline, then the design system, then the viewer's own (the profile, the theme), with Settings at the foot.
// Everything the rail reaches is a view at its own route, never a dialog; dialogs are for what opens from inside a
// view. The open view fills white. A mustard badge on a view counts what waits there. Every icon names itself in a
// tracked tip that slides out beside it on hover or focus. Under 720 px the rail lies along the bottom.
import { Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Moon, Palette, Settings, Sun, UserRound, type LucideIcon } from 'lucide-react'
import { MAIN_VIEWS, RAIL_VIEWS, VIEW_GROUPS, type RailView } from '@/app/nav'
import { useScreens } from '@/stores/screens'
import { useThemeStore } from '@/stores/theme'
import { useNeeds, type Lens } from '@/os/needs'
import { cn } from '@/lib/utils/cn'

function RailButton({ icon: Icon, label, on, badge, door, onPress }: { icon: LucideIcon; label: string; on?: boolean; badge?: number; door?: string; onPress(el: HTMLElement): void }) {
  return (
    <button
      type="button"
      data-door={door}
      aria-label={badge ? `${label}: ${badge} waiting` : label}
      aria-current={on ? 'page' : undefined}
      onClick={(e) => onPress(e.currentTarget)}
      className={cn('rail-btn group/rb relative grid h-10 w-10 flex-none place-items-center rounded-full', on && 'rail-on')}
    >
      <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
      {!!badge && (
        <span aria-hidden="true" className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-mustard px-1 text-[10.5px]/none font-semibold text-on-need tabular-nums">
          {badge}
        </span>
      )}
      <span aria-hidden="true" className="rail-tip">{label}</span>
    </button>
  )
}

const Rule = () => <i aria-hidden="true" className="rail-rule" />

/** Which needs each view's badge counts. */
const BADGE: Record<string, Lens[]> = { today: ['operations', 'sales'], reviews: ['clinical'], care: ['care'] }

export function Rail() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const needs = useNeeds()
  const mode = useThemeStore((s) => s.mode)
  const dark = mode === 'dark' || (mode === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
  // every press goes to a view: open screens close, and the frame shows the place
  const go = (path: string) => {
    useScreens.getState().closeAll()
    navigate(path)
  }
  const place = (id: RailView) => ({ on: pathname === RAIL_VIEWS[id], onPress: () => go(RAIL_VIEWS[id]) })
  const badge = (id: string) => (BADGE[id] ? needs.filter((n) => BADGE[id].includes(n.lens)).length : undefined)
  return (
    <nav aria-label="Main" className="rail">
      {VIEW_GROUPS.map((group, i) => (
        <Fragment key={group}>
          {i > 0 && <Rule />}
          <div className="rail-group" role="group" aria-label={group}>
            {MAIN_VIEWS.filter((v) => v.group === group).map((v) => (
              <RailButton key={v.id} icon={v.icon} label={v.name} door={`rail-${v.id}`} on={v.path === pathname} badge={badge(v.id)} onPress={() => go(v.path)} />
            ))}
          </div>
        </Fragment>
      ))}
      <Rule />
      <div className="rail-group">
        <RailButton icon={Palette} label="Design system" door="rail-design" {...place('design')} />
        <RailButton icon={UserRound} label="Your profile" door="rail-profile" {...place('profile')} />
        <RailButton icon={dark ? Moon : Sun} label={dark ? 'Dark mode. Switch to light' : 'Light mode. Switch to dark'} onPress={() => useThemeStore.getState().setMode(dark ? 'light' : 'dark')} />
      </div>
      <div className="rail-foot">
        <RailButton icon={Settings} label="Settings" door="rail-settings" {...place('settings')} />
      </div>
    </nav>
  )
}
