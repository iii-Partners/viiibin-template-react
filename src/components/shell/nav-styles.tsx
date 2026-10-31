// The two nav styles, each with a small drawing, as a choice: the header pill across the top, or the rail down the
// side. Settings and the Design system screen both show it; the choice applies at once and is kept in this browser.
// With the rail, the places it reaches are views, so a place open as a screen when the viewer picks the rail becomes
// its view. (Picking the header pill on a rail view, the route turns it back into a screen; see routes/rail-view.tsx.)
import { useNavigate } from 'react-router'
import { RAIL_VIEWS, isRailView } from '@/app/nav'
import { usePreferencesStore, type NavStyle } from '@/stores/preferences'
import { useScreens } from '@/stores/screens'
import { cn } from '@/lib/utils/cn'

// a small drawing of each nav style: the header pill across the top, or the ink rail down the side
export const NAVS: { id: NavStyle; word: string; note: string; draw: React.ReactNode }[] = [
  {
    id: 'bar', word: 'Header', note: 'The views across the top',
    draw: (
      <svg viewBox="0 0 120 64" className="h-auto w-full" aria-hidden="true">
        <rect x="0.5" y="0.5" width="119" height="63" className="fill-ground stroke-line" />
        <rect x="7" y="6" width="106" height="11" rx="5.5" className="fill-panel stroke-line" />
        <rect x="44" y="8.5" width="14" height="6" rx="3" className="fill-text" />
        <rect x="61" y="10.5" width="11" height="2" className="fill-dim" />
        <rect x="12" y="10.5" width="16" height="2" className="fill-text" />
        <circle cx="106" cy="11.5" r="3" className="fill-none stroke-edge" />
        <rect x="7" y="23" width="70" height="34" className="fill-panel stroke-line" />
        <rect x="81" y="23" width="32" height="34" className="fill-band stroke-line" />
      </svg>
    ),
  },
  {
    id: 'rail', word: 'Rail', note: 'Icons down the side',
    draw: (
      <svg viewBox="0 0 120 64" className="h-auto w-full" aria-hidden="true">
        <rect x="0.5" y="0.5" width="119" height="63" className="fill-ground stroke-line" />
        <rect x="6" y="6" width="13" height="52" rx="6.5" fill="#0f2a38" />
        <circle cx="12.5" cy="14" r="3.6" fill="#ffffff" />
        <circle cx="12.5" cy="24" r="2.2" fill="#ffffff" opacity="0.6" />
        <circle cx="12.5" cy="50" r="2.2" fill="#ffffff" opacity="0.6" />
        <rect x="26" y="9" width="28" height="3" className="fill-text" />
        <rect x="26" y="20" width="54" height="37" className="fill-panel stroke-line" />
        <rect x="84" y="20" width="29" height="37" className="fill-band stroke-line" />
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
            'grid justify-items-start gap-2 border p-3 text-left transition-colors duration-(--dur-hover)',
            navStyle === n.id ? 'border-text bg-wash' : 'border-line hover:border-edge',
          )}
        >
          {n.draw}
          <span className="mt-1 font-display text-[19px]/none font-light">{n.word}</span>
          <span className="text-[12.5px] text-dim">{n.note}</span>
        </button>
      ))}
    </div>
  )
}
