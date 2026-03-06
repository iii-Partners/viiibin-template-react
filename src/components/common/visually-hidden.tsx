import type { ReactNode } from 'react'

type VisuallyHiddenProps = {
  children: ReactNode
  /** HTML element to render. Defaults to 'span'. */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'
}

/**
 * Visually Hidden
 *
 * Renders content that is visually hidden but remains accessible
 * to screen readers. Uses the standard sr-only CSS technique.
 */
export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </Component>
  )
}
