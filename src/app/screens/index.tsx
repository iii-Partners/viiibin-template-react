// The screens: every child view in the app. None has a route; each opens as a dialog over the main view, grown from
// the door that opened it, and layers over any screen already open. To add one: give it an id in stores/screens.ts,
// a head and a body here, and a door that calls openScreen(id, params, element).
import type { ReactNode } from 'react'
import { ScreenDialog, type ScreenHead } from '@/components/shell/screen-dialog'
import { useScreens, type OpenScreen, type ScreenId } from '@/stores/screens'
import { ProfileScreen } from './profile'
import { SettingsScreen } from './settings'
import { DesignScreen } from './design'
import { GuestScreen, InsightScreen, RetreatScreen, SessionScreen, StepScreen } from './os'
import { useGuestHead, useInsightHead, useRetreatHead, useSessionHead, useStepHead } from './os-heads'

type Def = { useHead(params: OpenScreen['params'] | undefined): ScreenHead; render(entry: OpenScreen): ReactNode }

const fixed = (head: ScreenHead) => () => head

export const SCREENS: Record<ScreenId, Def> = {
  profile: { useHead: fixed({ kind: 'Account', title: 'Profile' }), render: () => <ProfileScreen /> },
  settings: { useHead: fixed({ kind: 'Account', title: 'Settings' }), render: () => <SettingsScreen /> },
  design: { useHead: fixed({ kind: 'Reference', title: 'Design system' }), render: () => <DesignScreen /> },
  guest: { useHead: (p) => useGuestHead(p?.id ? String(p.id) : undefined), render: (e) => <GuestScreen id={String(e.params?.id)} /> },
  retreat: { useHead: (p) => useRetreatHead(p?.id ? String(p.id) : undefined), render: (e) => <RetreatScreen id={String(e.params?.id)} /> },
  step: { useHead: (p) => useStepHead(p?.id ? String(p.id) : undefined), render: (e) => <StepScreen id={String(e.params?.id)} /> },
  insight: { useHead: (p) => useInsightHead(p?.id ? String(p.id) : undefined), render: (e) => <InsightScreen id={String(e.params?.id)} /> },
  session: { useHead: (p) => useSessionHead(Number(p?.n)), render: (e) => <SessionScreen n={Number(e.params?.n)} /> },
}

function Layer({ entry, depth }: { entry: OpenScreen; depth: number }) {
  const def = SCREENS[entry.id]
  const head = def.useHead(entry.params)
  return (
    <ScreenDialog entry={entry} depth={depth} head={head}>
      {def.render(entry)}
    </ScreenDialog>
  )
}

/** A screen shown as a view in the frame (the rail's places): the same head and body, without the dialog. Its kind
 *  over its title, as the main views lead, and its parts arrive in reading order. */
export function ScreenView({ id }: { id: ScreenId }) {
  const def = SCREENS[id]
  const head = def.useHead(undefined)
  return (
    <div className="arrive grid content-start gap-6">
      <div className="grid gap-3 pb-2">
        <small className="eyebrow">{head.kind}</small>
        <h1 className="type-display @max-[700px]/frame:text-[40px]/[1.05]">{head.title}</h1>
      </div>
      {def.render({ key: `view-${id}`, id })}
    </div>
  )
}

/** Every open screen, bottom to top. */
export function ScreenHost() {
  const stack = useScreens((s) => s.stack)
  return (
    <>
      {stack.filter((e) => SCREENS[e.id]).map((e, i) => (
        <Layer key={e.key} entry={e} depth={i} />
      ))}
    </>
  )
}
