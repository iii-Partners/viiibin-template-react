// A dropdown menu: shadcn's API over Radix, drawn as the design system's frosted menu (.menu and .menu-item in
// src/styles/design.css), never the browser's. Radix handles focus, arrow keys, typeahead and Esc, and portals the list
// to the body so no clipping parent cuts it off.
import * as React from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils/cn'

const DropdownMenu = Menu.Root
const DropdownMenuTrigger = Menu.Trigger

const DropdownMenuContent = React.forwardRef<React.ComponentRef<typeof Menu.Content>, React.ComponentPropsWithoutRef<typeof Menu.Content>>(
  ({ className, sideOffset = 10, ...props }, ref) => (
    <Menu.Portal>
      <Menu.Content ref={ref} sideOffset={sideOffset} className={cn('menu z-[80] min-w-[220px] p-1.5', className)} {...props} />
    </Menu.Portal>
  ),
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<React.ComponentRef<typeof Menu.Item>, React.ComponentPropsWithoutRef<typeof Menu.Item>>(
  ({ className, ...props }, ref) => <Menu.Item ref={ref} className={cn('menu-item gap-3 !pl-3.5', className)} {...props} />,
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = React.forwardRef<React.ComponentRef<typeof Menu.Separator>, React.ComponentPropsWithoutRef<typeof Menu.Separator>>(
  ({ className, ...props }, ref) => <Menu.Separator ref={ref} className={cn('mx-2 my-1 h-px bg-line', className)} {...props} />,
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
