// The header as a floating pill of frosted glass, after the deck's header: the app's name in Newsreader on the left,
// the main views as tracked words in the middle (the open one a solid ink pill), and the tools (theme, settings, the
// profile) as round buttons on the right, past a hairline. Pressing a view closes any open
// screens and switches the view at once. Under 720 px the views leave the pill for a second pill under it, side by
// side, in reach of the thumb.
import { useLocation, useNavigate } from 'react-router'
import { Moon, Settings, Sun, UserRound } from 'lucide-react'
import { MAIN_VIEWS, type MainView } from '@/app/nav'
import { useScreens, openScreen } from '@/stores/screens'
import { useThemeStore } from '@/stores/theme'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'App'

function useGo() {
  const navigate = useNavigate()
  return (v: MainView) => {
    useScreens.getState().closeAll()
    navigate(v.path)
  }
}

function Views({ at, className }: { at: string; className: string }) {
  const go = useGo()
  return (
    <nav aria-label="Main" className={className}>
      {MAIN_VIEWS.map((v) => (
        <button key={v.id} type="button" aria-current={v.path === at ? 'page' : undefined} onClick={() => go(v)} className="topnav-link">
          {v.name}
        </button>
      ))}
    </nav>
  )
}

function Tools() {
  const mode = useThemeStore((s) => s.mode)
  const dark = mode === 'dark' || (mode === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
  return (
    <div className="flex items-center gap-0.5">
      <button type="button" data-door="theme" className="round ghost" aria-label={dark ? 'Dark mode. Switch to light' : 'Light mode. Switch to dark'} title={dark ? 'Switch to light' : 'Switch to dark'} onClick={() => useThemeStore.getState().setMode(dark ? 'light' : 'dark')}>
        {dark ? <Moon size={17} strokeWidth={1.5} aria-hidden="true" /> : <Sun size={17} strokeWidth={1.5} aria-hidden="true" />}
      </button>
      <button type="button" data-door="settings" className="round ghost" aria-label="Settings" title="Settings" onClick={(e) => openScreen('settings', undefined, e.currentTarget)}>
        <Settings size={17} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <button type="button" data-door="profile" className="round" aria-label="Your profile" title="Your profile" onClick={(e) => openScreen('profile', undefined, e.currentTarget)}>
        <UserRound size={17} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  )
}

/** The header. `slim` (the rail holds the nav and the tools) keeps only the app's name. */
export function Header({ slim = false }: { slim?: boolean }) {
  const { pathname } = useLocation()
  if (slim)
    return (
      <header className="flex h-[52px] items-center">
        <span className="topbar-name !text-[24px]">{APP_NAME}</span>
      </header>
    )
  return (
    <header className="grid gap-2.5">
      <div className="topbar">
        <span className="topbar-name min-w-0 truncate">{APP_NAME}</span>
        <Views at={pathname} className="topnav mx-auto" />
        <span aria-hidden="true" className="h-6 w-px flex-none bg-line max-[720px]:ml-auto" />
        <Tools />
      </div>
      <Views at={pathname} className="topnav-phone" />
    </header>
  )
}
