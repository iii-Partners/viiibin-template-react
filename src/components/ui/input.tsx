// shadcn/ui's Input on the design system's field: the system's edge, radius, type and focus ring.
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(({ className, type = 'text', ...props }, ref) => (
  <input ref={ref} type={type} className={cn('field', className)} {...props} />
))
Input.displayName = 'Input'

export { Input }
