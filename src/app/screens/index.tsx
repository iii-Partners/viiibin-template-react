// The screens: every child view in the app. None has a route; each opens as a dialog over the main view, grown from
// the door that opened it, and layers over any screen already open. To add one: give it an id in stores/screens.ts,
// a head and a body here, and a door that calls openScreen(id, params, element).
import type { ReactNode } from 'react'
import { ScreenDialog, type ScreenHead } from '@/components/shell/screen-dialog'
import { useScreens, type OpenScreen, type ScreenId } from '@/stores/screens'
import { ProfileScreen } from './profile'
import { SettingsScreen } from './settings'
import { ItemScreen, useItemHead } from './item'
import { DesignScreen } from './design'
import { DialScreen } from './dial'

type Def = { useHead(params: OpenScreen['params'] | undefined): ScreenHead; render(entry: OpenScreen): ReactNode }

const fixed = (head: ScreenHead) => () => head

export const SCREENS: Record<ScreenId, Def> = {
  profile: { useHead: fixed({ kind: 'Account', title: 'Profile' }), render: () => <ProfileScreen /> },
  settings: { useHead: fixed({ kind: 'Account', title: 'Settings' }), render: () => <SettingsScreen /> },
  item: { useHead: (p) => useItemHead(Number(p?.id), p?.part ? String(p.part) : undefined), render: (e) => <ItemScreen id={Number(e.params?.id)} screenKey={e.key} part={e.params?.part ? String(e.params.part) : undefined} /> },
  design: { useHead: fixed({ kind: 'Reference', title: 'Design system' }), render: () => <DesignScreen /> },
  dial: { useHead: fixed({ kind: 'Analytics', title: 'Bird’s-eye view' }), render: () => <DialScreen /> },
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
    <div className="arrive grid content-start gap-5">
      <div className="grid gap-1">
        <small className="text-[11.5px]/[1.3] font-semibold tracking-[0.1em] text-dim uppercase">{head.kind}</small>
        <h1 className="text-[40px]/[1.05] font-light tracking-[-0.04em] @max-[700px]/frame:text-[30px]">{head.title}</h1>
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
