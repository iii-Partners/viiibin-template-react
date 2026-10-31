// The app's frame: two parts in one column the height of the window, on the cream ground. The header pill holds the
// top and never scrolls; the frame (the open main view) takes the rest, scrolls on its own and fades out as it passes
// under the header. Both float inside the safe margin, and the work sits in a centered column up to 1320 px wide, as
// the deck's slides do. Screens open over everything as layered dialogs, and a confirm over those. With the rail
// (Settings, Navigation), the nav leaves the header for a capsule down the left (along the bottom on a phone), and the
// header keeps only the app's name.
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Header } from '@/components/shell/header'
import { Rail } from '@/components/shell/rail'
import { usePreferencesStore } from '@/stores/preferences'
import { ScreenHost } from '@/app/screens'
import { ConfirmHost } from '@/components/system/confirm'
import { Ambient } from '@/components/shell/ambient'

export function AppShell() {
  const { pathname } = useLocation()
  const rail = usePreferencesStore((s) => s.navStyle) === 'rail'
  // whether the frame has scrolled, for the view it scrolled in: a new view starts unscrolled
  const [scroll, setScroll] = useState({ path: pathname, on: false })
  const scrolled = scroll.path === pathname && scroll.on
  // each main view opens at its top
  useEffect(() => {
    document.getElementById('main-content')?.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <>
      <Ambient />
      <div className="relative flex h-dvh">
      {rail && (
        // the rail sits over the header and the frame (11), so its labels show over both, and under every dialog (14
        // and up); on a phone it lies along the bottom
        <div className="relative z-[11] flex-none py-[calc(var(--spacing-safe)/2)] pl-safe max-[720px]:fixed max-[720px]:inset-x-0 max-[720px]:bottom-0 max-[720px]:px-safe max-[720px]:pt-0 max-[720px]:pb-[max(12px,env(safe-area-inset-bottom))]">
          <Rail />
        </div>
      )}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* the header sits under every dialog (screens 14 and up, the confirm 40); half the safe margin above it */}
        <div className="relative z-10 flex-none px-safe pt-[calc(var(--spacing-safe)/2)] pb-1">
          <div className="mx-auto w-full max-w-[1320px]">
            <Header slim={rail} />
          </div>
        </div>
        {/* the frame is a container: views fit their layout to its width, not the window's */}
        <main
          id="main-content"
          tabIndex={-1}
          onScroll={(e) => setScroll({ path: pathname, on: e.currentTarget.scrollTop > 4 })}
          className={`relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-safe pt-[clamp(20px,4vh,40px)] pb-safe outline-none ${rail ? 'max-[720px]:pb-[96px]' : ''} ${scrolled ? 'frame-fade' : ''}`}
        >
          {/* keyed by view, so switching views replays each view's arrival; the column is a container, so views fit
              their layout to its width, not the window's */}
          <div key={pathname} className="@container/frame mx-auto w-full max-w-[1320px]">
            <Outlet />
          </div>
        </main>
      </div>
      </div>
      <ScreenHost />
      <ConfirmHost />
    </>
  )
}
