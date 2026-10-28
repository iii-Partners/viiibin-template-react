// The two nav styles, each with a small drawing, as a choice: the wedge bar across the top, or the rail down the side.
// Settings and the Design system screen both show it; the choice applies at once and is kept in this browser. With
// the rail, the places it reaches are views, so a place open as a screen when the viewer picks the rail becomes its
// view. (Picking the wedge bar on a rail view, the route turns it back into a screen; see routes/rail-view.tsx.)
import { useNavigate } from 'react-router'
import { RAIL_VIEWS, isRailView } from '@/app/nav'
import { usePreferencesStore, type NavStyle } from '@/stores/preferences'
import { useScreens } from '@/stores/screens'
import { cn } from '@/lib/utils/cn'

// a small drawing of each nav style: the wedge bar across the top, or the rail down the side
export const NAVS: { id: NavStyle; word: string; note: string; draw: React.ReactNode }[] = [
  {
    id: 'wedges', word: 'Wedge bar', note: 'The views across the top',
    draw: (
      <svg viewBox="0 0 120 64" className="h-auto w-full" aria-hidden="true">
        <rect x="1" y="1" width="118" height="62" rx="6" className="fill-glass-raised" />
        <path d="M8 8H42L38 18H12Z" className="fill-brand" />
        <path d="M36 8H84L80 20H40Z" className="fill-glass" />
        <path d="M78 8H112L108 18H82Z" className="fill-glass" />
        <rect x="8" y="26" width="64" height="30" rx="3" className="fill-glass" />
        <rect x="78" y="26" width="34" height="30" rx="3" className="fill-glass" />
      </svg>
    ),
  },
  {
    id: 'rail', word: 'Rail', note: 'Icons down the side',
    draw: (
      <svg viewBox="0 0 120 64" className="h-auto w-full" aria-hidden="true">
        <rect x="1" y="1" width="118" height="62" rx="6" className="fill-glass-raised" />
        <rect x="6" y="6" width="14" height="52" rx="4" className="fill-glass" />
        <rect x="9" y="10" width="8" height="8" rx="2" className="fill-brand" />
        <rect x="9" y="22" width="8" height="8" rx="2" className="fill-glass-raised" />
        <rect x="9" y="46" width="8" height="8" rx="2" className="fill-glass-raised" />
        <rect x="26" y="8" width="40" height="6" rx="2" className="fill-glass" />
        <rect x="26" y="20" width="56" height="36" rx="3" className="fill-glass" />
        <rect x="88" y="20" width="26" height="36" rx="3" className="fill-glass" />
      </svg>
    ),
  },
]

export function NavStylePicker() {
  const navStyle = usePreferencesStore((s) => s.navStyle)
  const setNavStyle = usePreferencesStore((s) => s.setNavStyle)
  const navigate = useNavigate()
  const pick = (id: NavStyle) => {
    setNavStyle(id)
    const top = useScreens.getState().stack.at(-1)
    if (id === 'rail' && top && isRailView(top.id)) {
      useScreens.getState().closeAll()
      navigate(RAIL_VIEWS[top.id])
    }
  }
  return (
    <div role="radiogroup" aria-label="Navigation" className="grid grid-cols-2 gap-2">
      {NAVS.map((n) => (
        <button
          key={n.id}
          type="button"
          role="radio"
          aria-checked={navStyle === n.id}
          onClick={() => pick(n.id)}
          className={cn(
            'grid justify-items-start gap-1.5 rounded-card border-2 px-3 py-3 text-left transition-colors duration-(--dur-hover)',
            navStyle === n.id ? 'border-brand bg-brand/8' : 'border-line hover:border-teal',
          )}
        >
          {n.draw}
          <b className="text-[14px] font-semibold">{n.word}</b>
          <span className="text-[12px] text-dim">{n.note}</span>
        </button>
      ))}
    </div>
  )
}
