import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

// ShadCN's button on the design system's 2 px button: an outline that glows on hover; the primary fills purple.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'gm-btn go',
        destructive: 'gm-btn !border-fault !text-fault hover:!text-white',
        outline: 'gm-btn',
        secondary: 'btn',
        ghost: 'rounded-base font-semibold text-[13px] text-text transition-colors duration-(--dur-hover) hover:bg-glass-raised hover:text-accent focus-visible:bg-glass-raised focus-visible:outline-none',
        link: 'font-medium text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: '!px-3 !py-2 !text-[12.5px]',
        lg: '!px-6 !py-3.5 !text-[14px]',
        icon: 'h-9 w-9 !p-0',
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
