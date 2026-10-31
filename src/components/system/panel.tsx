// The panel: every card and panel takes it. Flat and square on the ground, edged by a hairline, as the deck's cards
// are. With `live`, it takes a press: its edge darkens and any `.arr` arrow inside moves. `on` lights it from
// elsewhere (a picked card, its ring on the dial pointed at). `band` makes it the view's one cool aqua lead surface.
// For an element that cannot take the component, put the class `.panel` on it.
import { createElement, type ComponentPropsWithoutRef, type ElementType, type ReactNode, type Ref } from 'react'
import { cn } from '@/lib/utils/cn'

type Props<T extends ElementType> = {
  as?: T
  live?: boolean
  on?: boolean
  band?: boolean
  className?: string
  children?: ReactNode
  ref?: Ref<HTMLElement>
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

export function Panel<T extends ElementType = 'div'>({ as, live, on, band, className, children, ...rest }: Props<T>) {
  return createElement(as ?? 'div', { ...rest, className: cn('panel grid', live && 'live', on && 'on', band && 'band', className) }, children)
}
