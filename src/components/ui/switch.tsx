// shadcn/ui's Switch on Radix: a pill track with a round thumb that slides; the track takes the accent when on.
// Styled by .switch in src/styles/design.css, so every variant restyles it through the tokens.
import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils/cn'

const Switch = React.forwardRef<React.ComponentRef<typeof SwitchPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitive.Root ref={ref} className={cn('switch', className)} {...props}>
      <SwitchPrimitive.Thumb className="switch-thumb" />
    </SwitchPrimitive.Root>
  ),
)
Switch.displayName = 'Switch'

export { Switch }
