export const statusBadgeClass: Record<string, string> = {
  Active: 'status-badge status-success',
  Inactive: 'status-badge status-neutral',
  Locked: 'status-badge status-error',
}

export const statusDot: Record<string, string> = {
  Active: 'bg-emerald-500',
  Inactive: 'bg-slate-400',
  Locked: 'bg-red-500',
}

export const categoryStyles: Record<string, string> = {
  'Core Role': 'bg-secondary/10 text-secondary',
  Operational: 'bg-primary/10 text-primary',
  Financial: 'status-badge status-warning',
  Standard: 'status-badge status-neutral',
}

export const securityScoreDefault = 94

/** Audit log action → badge class (matched by substring against log.action). */
export const auditActionBadge: Record<string, string> = {
  Create: 'status-badge status-success',
  Update: 'status-badge status-info',
  Delete: 'status-badge status-error',
  Login: 'status-badge status-info',
  Lock: 'status-badge status-warning',
}

/** Audit log action → dot color class (matched by substring against log.action). */
export const auditActionDot: Record<string, string> = {
  Create: 'bg-emerald-500',
  Update: 'bg-blue-500',
  Delete: 'bg-red-500',
  Login: 'bg-sky-500',
  Lock: 'bg-amber-500',
}

/** Resolve an audit action string to its badge/dot key ('Create' | 'Update' | ...). */
export function resolveAuditActionKey(action: string): string {
  return (
    Object.keys(auditActionBadge).find((k) => action.toLowerCase().includes(k.toLowerCase())) ??
    'Update'
  )
}

/** Human labels for backend Action enum (seeded permissions). */
export const permissionActionLabels: Record<string, string> = {
  VIEW: 'View',
  CREATE: 'Create',
  UPDATE: 'Edit',
  DELETE: 'Delete',
  APPROVE: 'Approve',
  EXPORT: 'Export',
  UNLOCK: 'Unlock',
}

/** User status filter options (UsersListPage status Select). */
export const userStatusOptions = [
  { value: 'All', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Locked', label: 'Locked' },
] as const