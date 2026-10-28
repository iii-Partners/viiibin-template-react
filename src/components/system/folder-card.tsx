// The folder card: every card and panel takes it. A tab rises on the card's left with a slanted shoulder over the
// body; one soft shadow follows both. With `glow`, pointing at it raises a subtle inner glow of light purple along the
// shape's outer edges; nothing lifts or moves. `on` lights it (a picked card). For panels that scroll, clip or cannot
// take a wrapper, put the one-element form `.gm-folder` on the element itself.
import { createElement, type ComponentPropsWithoutRef, type ElementType, type ReactNode, type Ref } from 'react'
import { cn } from '@/lib/utils/cn'

type Props<T extends ElementType> = {
  as?: T
  glow?: boolean
  on?: boolean
  bodyClassName?: string
  className?: string
  children?: ReactNode
  ref?: Ref<HTMLElement>
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

export function FolderCard<T extends ElementType = 'div'>({ as, glow, on, bodyClassName, className, children, ...rest }: Props<T>) {
  return createElement(
    as ?? 'div',
    { ...rest, className: cn('gm-tabcard min-w-0', glow && 'gm-tabcard-live gm-tabcard-glow', on && 'gm-on', as === 'button' && 'text-left', className) },
    // a button may hold phrasing content only, so its body is a span laid out as a grid
    createElement(as === 'button' || as === 'a' ? 'span' : 'div', { className: cn('gm-tabcard-body grid px-5 pt-3 pb-5', bodyClassName) }, children),
  )
}
