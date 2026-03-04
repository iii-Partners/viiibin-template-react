export type Role = 'user' | 'admin' | 'owner'

export type Permission = 'read' | 'write' | 'delete' | 'manage'

const rolePermissions: Record<Role, Permission[]> = {
  user: ['read'],
  admin: ['read', 'write', 'delete'],
  owner: ['read', 'write', 'delete', 'manage'],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}
