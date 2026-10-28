// The rail: the alternative to the wedge bar (Settings, Navigation). One glass column down the left edge, inside the
// safe margin: the main views, then the bird's-eye view and the design system, then the viewer's own (the profile, the
// theme), with Settings at the foot. Everything the rail reaches is a view at its own route, never a dialog; dialogs
// are for what opens from inside a view. The open view fills purple. A count badge on Dashboard says how much waits on
// the viewer. Every icon names itself in a label that slides out beside it on hover or focus. Under 720 px the rail lies along the bottom, in reach of the thumb.
import { useLocation, useNavigate } from 'react-router'
import { Gauge, Moon, Palette, Settings, Sun, UserRound, type LucideIcon } from 'lucide-react'
import { MAIN_VIEWS, RAIL_VIEWS, type RailView } from '@/app/nav'
import { useScreens } from '@/stores/screens'
import { useThemeStore } from '@/stores/theme'
import { useNeedsCount } from '@/hooks/use-steps'
import { cn } from '@/lib/utils/cn'

function RailButton({ icon: Icon, label, on, badge, door, onPress }: { icon: LucideIcon; label: string; on?: boolean; badge?: number; door?: string; onPress(el: HTMLElement): void }) {
  return (
    <button
      type="button"
      data-door={door}
      aria-label={badge ? `${label}: ${badge} waiting` : label}
      aria-current={on ? 'page' : undefined}
      onClick={(e) => onPress(e.currentTarget)}
      className={cn('rail-btn group/rb relative grid h-11 w-11 flex-none place-items-center rounded-tile', on && 'rail-on')}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      {!!badge && (
        <span aria-hidden="true" className="absolute -right-1.5 -bottom-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-glass bg-brand px-1 font-figure text-[12px]/none font-semibold text-on-brand tabular-nums">
          {badge}
        </span>
      )}
      <span aria-hidden="true" className="rail-tip">{label}</span>
    </button>
  )
}

const Rule = () => <i aria-hidden="true" className="rail-rule" />

export function Rail() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const needs = useNeedsCount()
  const mode = useThemeStore((s) => s.mode)
  const dark = mode === 'dark' || (mode === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
  // every press goes to a view: open screens close, and the frame shows the place
  const go = (path: string) => {
    useScreens.getState().closeAll()
    navigate(path)
  }
  const place = (id: RailView) => ({ on: pathname === RAIL_VIEWS[id], onPress: () => go(RAIL_VIEWS[id]) })
  return (
    <nav aria-label="Main" className="rail">
      <div className="rail-group">
        {MAIN_VIEWS.map((v) => (
          <RailButton
            key={v.id}
            icon={v.icon}
            label={v.name}
            on={v.path === pathname}
            badge={v.id === 'dashboard' ? needs : undefined}
            onPress={() => go(v.path)}
          />
        ))}
      </div>
      <Rule />
      <div className="rail-group">
        <RailButton icon={Gauge} label="Bird’s-eye view" door="rail-dial" {...place('dial')} />
        <RailButton icon={Palette} label="Design system" door="rail-design" {...place('design')} />
      </div>
      <Rule />
      <div className="rail-group">
        <RailButton icon={UserRound} label="Your profile" door="rail-profile" {...place('profile')} />
        <RailButton icon={dark ? Moon : Sun} label={dark ? 'Dark mode. Switch to light' : 'Light mode. Switch to dark'} onPress={() => useThemeStore.getState().setMode(dark ? 'light' : 'dark')} />
      </div>
      <div className="rail-foot">
        <RailButton icon={Settings} label="Settings" door="rail-settings" {...place('settings')} />
      </div>
    </nav>
  )
}
