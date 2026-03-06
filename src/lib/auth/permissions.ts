export type Role = 'user' | 'admin' | 'owner'

export type Permission =
  | 'read'
  | 'write'
  | 'delete'
  | 'manage'
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_settings'
  | 'manage_billing'
  | 'view_analytics'

const rolePermissions: Record<Role, Permission[]> = {
  user: ['read', 'view_dashboard'],
  admin: ['read', 'write', 'delete', 'view_dashboard', 'manage_users', 'manage_settings', 'view_analytics'],
  owner: [
    'read',
    'write',
    'delete',
    'manage',
    'view_dashboard',
    'manage_users',
    'manage_settings',
    'manage_billing',
    'view_analytics',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] ?? []
}
