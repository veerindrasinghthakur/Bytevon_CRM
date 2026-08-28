export const statusBadgeClass: Record<string, string> = {
  Active: 'status-badge status-success',
  Inactive: 'status-badge status-neutral',
  Locked: 'status-badge status-error',
}

export const statusDot: Record<string, string> = {
  Active: 'bg-[var(--color-success-emerald)]',
  Inactive: 'bg-on-surface-variant',
  Locked: 'bg-[var(--color-error-red)]',
}

export const categoryStyles: Record<string, string> = {
  'Core Role': 'bg-secondary/10 text-secondary',
  Operational: 'bg-primary/10 text-primary',
  Financial: 'status-badge status-warning',
  Standard: 'status-badge status-neutral',
}

export const categoryBadgeStyles: Record<string, string> = {
  'Core Role': 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
  Operational: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
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
  Create: 'bg-[var(--color-success-emerald)]',
  Update: 'bg-[var(--color-primary-blue)]',
  Delete: 'bg-[var(--color-error-red)]',
  Login: 'bg-[var(--color-info-sky)]',
  Lock: 'bg-[var(--color-warning-amber)]',
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

/** Role status filter options (RolesListPage status Select). */
export const roleStatusOptions = [
  { value: 'All', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Archived', label: 'Archived' },
] as const

/** Role category filter options (RolesListPage category Select). */
export const roleCategoryOptions = [
  { value: 'All', label: 'All Categories' },
  { value: 'Core Role', label: 'Core Role' },
  { value: 'Operational', label: 'Operational' },
  { value: 'Financial', label: 'Financial' },
  { value: 'Standard', label: 'Standard' },
] as const

/** Hierarchy level options for role creation. */
export const hierarchyLevels = [
  '1 (Entry)',
  '2',
  '3',
  '4',
  '5 (Management)',
  '10 (Executive)',
] as const

/** Inherit permissions options for role creation. */
export const inheritOptions = [
  'None (Custom)',
  'Basic Employee',
  'Financial Analyst',
  'HR Manager',
] as const