import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import type { Permission } from '@/lib/auth/permissions'

type PermissionGuardProps = {
  /** The permission required to see the children */
  permission: Permission
  /** Content to render when the user has the required permission */
  children: ReactNode
  /** Optional fallback to render instead of default "Access Denied" */
  fallback?: ReactNode
}

/**
 * Guards children behind a specific permission check.
 * Uses hasPermission() from the permissions module.
 */
export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission)) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            You do not have the required permission to view this content.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
