// shadcn/ui's Tooltip on Radix, in place of the browser's title box: a small frosted bubble in the system's type.
// As in current shadcn/ui, each Tooltip carries its own provider, so a tooltip works wherever it renders (a test, a
// portal); the provider at the app's root (providers.tsx) sets the shared delays. For the common case, use <Tip label>.
import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils/cn'

const TooltipProvider = TooltipPrimitive.Provider

function Tooltip(props: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={150}>
      <TooltipPrimitive.Root {...props} />
    </TooltipProvider>
  )
}
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<React.ComponentRef<typeof TooltipPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(
  ({ className, sideOffset = 8, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn('tip-bubble z-[90]', className)} {...props} />
    </TooltipPrimitive.Portal>
  ),
)
TooltipContent.displayName = 'TooltipContent'

/** An element with a tooltip: the child is the trigger (it keeps its own element), the label is the bubble. */
function Tip({ label, children, side = 'top' }: { label: React.ReactNode; children: React.ReactElement; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Tip }
