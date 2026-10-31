import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

// ShadCN's button on the design system's pill: an outline at rest; the primary fills with the ink.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'pill go',
        destructive: 'pill risky',
        outline: 'pill',
        secondary: 'pill sm',
        ghost: 'rounded-full text-[13px] font-medium text-text transition-colors duration-(--dur-hover) hover:bg-wash hover:text-accent focus-visible:bg-wash focus-visible:outline-none',
        link: 'font-medium text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'sm',
        lg: '!px-7 !py-4',
        icon: 'h-10 w-10 !p-0',
      },
    },
    compoundVariants: [
      { variant: 'ghost', size: 'default', className: 'px-3 py-2' },
      { variant: 'ghost', size: 'sm', className: 'px-2.5 py-1.5' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
