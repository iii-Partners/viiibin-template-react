// shadcn/ui's Textarea on the design system's field.
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<'textarea'>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('field min-h-[88px] resize-y', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export { Textarea }
