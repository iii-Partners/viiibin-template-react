import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import type { Role } from '@/lib/auth/permissions'

type RoleGuardProps = {
  /** Roles that are allowed to see the children */
  roles: Role[]
  /** Content to render when the user has the required role */
  children: ReactNode
  /** Optional fallback to render instead of default "Access Denied" */
  fallback?: ReactNode
}

/**
 * Guards children behind a role check.
 * Renders children only if the current user's role is in the allowed list.
 */
export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { role } = usePermissions()

  if (!roles.includes(role)) {
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            You do not have permission to view this content.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
