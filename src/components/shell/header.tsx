// The header as a wedge bar: each main view is its own solid trapezoid on a soft shadow, no outline, alternating
// wide-top and wide-bottom so every slanted edge runs parallel to its neighbor's. The app's name sits in the middle
// wedge, a little taller, and does nothing on press. The open view fills purple; pointing at a wedge raises a very
// subtle inner glow, clipped inside it. Pressing a wedge closes any open screens and switches the view at once. The
// tools (the bird's-eye dial, theme, settings, the profile) sit on one white card at the right. Under 720 px the wedges give way to the
// app's name and the views two across.
import * as React from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Gauge, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { MAIN_VIEWS, type MainView } from '@/app/nav'
import { useScreens, openScreen } from '@/stores/screens'
import { useThemeStore } from '@/stores/theme'
import { cn } from '@/lib/utils/cn'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'App'

/** One wedge, drawn in pixels at its measured width so the slant holds at any width. */
function Wedge({ kind, h, s, on, onPress, label, className, style, children }: { kind: 'down' | 'up'; h: number; s: number; on?: boolean; onPress?(): void; label: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const ref = React.useRef<HTMLElement>(null)
  const [w, setW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const clip = React.useId()
  const p = 2.5
  const d = kind === 'down' ? `M${p} ${p}H${w - p}L${w - s} ${h - p}H${s}Z` : `M${s} ${p}H${w - s}L${w - p} ${h - p}H${p}Z`
  const Tag = onPress ? 'button' : 'div'
  return (
    <Tag
      ref={ref as React.Ref<never>}
      {...(onPress ? { type: 'button', onClick: onPress, 'aria-current': on ? 'page' : undefined } : {})}
      aria-label={onPress ? undefined : label}
      style={{ height: h, ...style }}
      className={cn('gm-wedge relative grid min-w-0 place-items-center px-8', onPress ? 'transition-transform duration-(--dur-hover) ease-open hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none' : 'gm-wedge-still', on && 'gm-wedge-on', className)}
    >
      {w > 0 && (
        <svg width={w} height={h} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
          <defs>
            <clipPath id={clip}>
              <path d={d} />
            </clipPath>
          </defs>
          <path d={d} strokeWidth="5" strokeLinejoin="round" />
          <path d={d} className="gm-wedge-glow" clipPath={`url(#${clip})`} />
        </svg>
      )}
      <span className="relative min-w-0 truncate">{children}</span>
    </Tag>
  )
}

function useGo() {
  const navigate = useNavigate()
  return (v: MainView) => {
    useScreens.getState().closeAll()
    navigate(v.path)
  }
}

function WedgeBar({ at }: { at: string }) {
  const go = useGo()
  const half = Math.ceil(MAIN_VIEWS.length / 2)
  // the name's wedge is wide at the top; each step away from it flips the kind
  const kind = (pos: number) => (Math.abs(half - pos) % 2 === 0 ? 'down' : 'up') as 'down' | 'up'
  const tile = (v: MainView, pos: number) => (
    <Wedge key={v.id} kind={kind(pos)} h={56} s={20} on={v.path === at} onPress={() => go(v)} label={v.name} className="flex-1 text-[15px] font-medium tracking-[-0.01em]" style={pos ? { marginLeft: -12 } : undefined}>
      {v.name}
    </Wedge>
  )
  return (
    <nav aria-label="Main" className="flex min-w-0 flex-1 items-start max-[720px]:hidden">
      {MAIN_VIEWS.slice(0, half).map((v, k) => tile(v, k))}
      <Wedge kind="down" h={64} s={23} label={APP_NAME} className="w-[300px] flex-none font-display text-[19px] font-medium tracking-[-0.02em]" style={{ marginLeft: -12 }}>
        {APP_NAME}
      </Wedge>
      {MAIN_VIEWS.slice(half).map((v, k) => tile(v, half + 1 + k))}
    </nav>
  )
}

const TOOL = 'grid h-[34px] w-[34px] place-items-center rounded-base text-text transition-colors duration-(--dur-hover) ease-out hover:bg-glass-raised hover:text-accent focus-visible:bg-glass-raised focus-visible:text-accent focus-visible:outline-none'

function Tools() {
  const mode = useThemeStore((s) => s.mode)
  const dark = mode === 'dark' || (mode === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
  return (
    <div className="flex items-center gap-1 rounded-card bg-glass p-1 shadow-card">
      <button type="button" data-door="dial-tool" className={TOOL} aria-label="Bird’s-eye view of the data" title="Bird’s-eye view" onClick={(e) => openScreen('dial', undefined, e.currentTarget)}>
        <Gauge size={17} aria-hidden="true" />
      </button>
      <button type="button" data-door="theme" className={TOOL} aria-label={dark ? 'Dark mode. Switch to light' : 'Light mode. Switch to dark'} title={dark ? 'Switch to light' : 'Switch to dark'} onClick={() => useThemeStore.getState().setMode(dark ? 'light' : 'dark')}>
        {dark ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
      </button>
      <button type="button" data-door="settings" className={TOOL} aria-label="Settings" title="Settings" onClick={(e) => openScreen('settings', undefined, e.currentTarget)}>
        <Settings size={17} aria-hidden="true" />
      </button>
      <button type="button" data-door="profile" className={TOOL} aria-label="Your profile" title="Your profile" onClick={(e) => openScreen('profile', undefined, e.currentTarget)}>
        <UserRound size={17} aria-hidden="true" />
      </button>
    </div>
  )
}

/** The header. `slim` (the rail holds the nav and the tools) keeps only the app's name. */
export function Header({ slim = false }: { slim?: boolean }) {
  const { pathname } = useLocation()
  const go = useGo()
  if (slim)
    return (
      <header className="flex h-[52px] items-center">
        <span className="font-display text-[21px] font-medium tracking-[-0.02em]">{APP_NAME}</span>
      </header>
    )
  return (
    <header className="flex flex-wrap items-start gap-x-4 gap-y-3 max-[720px]:items-center">
      <WedgeBar at={pathname} />
      <span className="hidden font-display text-[19px] font-medium tracking-[-0.02em] max-[720px]:block">{APP_NAME}</span>
      <div className="flex-none pt-2.5 max-[720px]:ml-auto max-[720px]:pt-0">
        <Tools />
      </div>
      <nav aria-label="Main" className="hidden w-full grid-cols-2 gap-2.5 max-[720px]:grid">
        {MAIN_VIEWS.map((v) => (
          <button key={v.id} type="button" aria-current={v.path === pathname ? 'page' : undefined} onClick={() => go(v)} className="gm-tab">
            <span className="truncate text-[14px] font-medium">{v.name}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}
