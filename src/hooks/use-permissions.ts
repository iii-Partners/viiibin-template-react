import { useAuthStore } from '@/stores/auth'
import { hasPermission, getPermissionsForRole, type Role, type Permission } from '@/lib/auth/permissions'

/**
 * Hook for checking the current user's role and permissions.
 *
 * Role is stored in the auth store. Falls back to 'user' if not set.
 * For server-authoritative RBAC, the role should be synced from the API
 * on login via the auth store.
 */
export function usePermissions() {
  const role = (useAuthStore((s) => (s as AuthStateWithRole).role) ?? 'user') as Role

  return {
    role,
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    permissions: getPermissionsForRole(role),
    isAdmin: role === 'admin' || role === 'owner',
    isOwner: role === 'owner',
  }
}

/**
 * Extended auth state type that includes role.
 * The auth store may or may not have a role field depending on setup.
 */
type AuthStateWithRole = {
  role?: Role
}
