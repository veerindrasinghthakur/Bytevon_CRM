import type { PermissionCatalog, RolePermissionAction } from '../types'

/** Mirrors backend seeded resources + Action enum (VIEW..EXPORT, UNLOCK). */
const ACTIONS: RolePermissionAction[] = [
  'VIEW',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'EXPORT',
  'UNLOCK',
]

const MODULE_NAMES = [
  'Dashboard',
  'Employees',
  'CRM',
  'Sales',
  'Projects',
  'Teams',
  'Attendance',
  'Leave',
  'Payroll',
  'Approvals',
  'Notifications',
  'Administration',
  'Audit',
  'Reports',
]

export const permissionCatalogSeed: PermissionCatalog = {
  modules: MODULE_NAMES,
  actions: ACTIONS,
  resources: MODULE_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    description: `${name} module resource`,
  })),
  permissions: MODULE_NAMES.flatMap((name, i) =>
    ACTIONS.map((action, j) => ({
      id: i * ACTIONS.length + j + 1,
      resource_id: i + 1,
      resource_name: name,
      action,
    })),
  ),
}
