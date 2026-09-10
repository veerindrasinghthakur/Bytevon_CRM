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
  CREATE: 'status-badge status-success',
  UPDATE: 'status-badge status-info',
  ARCHIVE: 'status-badge status-error',
  LOGIN: 'status-badge status-info',
  LOGOUT: 'status-badge status-neutral',
  APPROVE: 'status-badge status-success',
  REJECT: 'status-badge status-error',
  // legacy keys still resolve via includes()
  Create: 'status-badge status-success',
  Update: 'status-badge status-info',
  Delete: 'status-badge status-error',
  Login: 'status-badge status-info',
  Lock: 'status-badge status-warning',
}

export const auditActionDot: Record<string, string> = {
  CREATE: 'bg-[var(--color-success-emerald)]',
  UPDATE: 'bg-[var(--color-primary-blue)]',
  ARCHIVE: 'bg-[var(--color-error-red)]',
  LOGIN: 'bg-[var(--color-info-sky)]',
  LOGOUT: 'bg-on-surface-variant',
  Create: 'bg-[var(--color-success-emerald)]',
  Update: 'bg-[var(--color-primary-blue)]',
  Delete: 'bg-[var(--color-error-red)]',
  Login: 'bg-[var(--color-info-sky)]',
  Lock: 'bg-[var(--color-warning-amber)]',
}

export const securityEventBadge: Record<string, string> = {
  Success: 'status-badge status-success',
  Blocked: 'status-badge status-error',
  Warning: 'status-badge status-warning',
}

export const securityEventDot: Record<string, string> = {
  Success: 'bg-[var(--color-success-emerald)]',
  Blocked: 'bg-[var(--color-error-red)]',
  Warning: 'bg-[var(--color-warning-amber)]',
}

/** Resolve an audit action string to its badge/dot key. */
export function resolveAuditActionKey(action: string): string {
  const upper = action.toUpperCase()
  if (auditActionBadge[upper]) return upper
  return (
    Object.keys(auditActionBadge).find((k) => action.toLowerCase().includes(k.toLowerCase())) ??
    'UPDATE'
  )
}

export const permissionActionLabels: Record<string, string> = {
  VIEW: 'View',
  CREATE: 'Create',
  UPDATE: 'Edit',
  DELETE: 'Delete',
  APPROVE: 'Approve',
  EXPORT: 'Export',
  UNLOCK: 'Unlock',
}

export const userStatusOptions = [
  { value: 'All', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Locked', label: 'Locked' },
]

export const roleStatusOptions = [
  { value: 'All', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Archived', label: 'Archived' },
] as const

export const roleCategoryOptions = [
  { value: 'All', label: 'All Categories' },
  { value: 'Core Role', label: 'Core Role' },
  { value: 'Operational', label: 'Operational' },
  { value: 'Financial', label: 'Financial' },
  { value: 'Standard', label: 'Standard' },
] as const

export const roleFilterStatusOptions = ['All', 'Active', 'Archived'] as const
export const roleFilterCategoryOptions = [
  'All',
  'Core Role',
  'Operational',
  'Financial',
  'Standard',
] as const

export const hierarchyLevels = [
  '1 (Entry)',
  '2',
  '3',
  '4',
  '5 (Management)',
  '10 (Executive)',
] as const

export const inheritOptions = [
  'None (Custom)',
  'Basic Employee',
  'Financial Analyst',
  'HR Manager',
] as const

export const holidayTypes = ['NATIONAL', 'REGIONAL', 'OPTIONAL', 'COMPANY'] as const

/** Values match backend AuditAction where possible (sent as query.action). */
export const auditActionOptions = [
  'All Actions',
  'CREATE',
  'UPDATE',
  'ARCHIVE',
  'LOGIN',
  'LOGOUT',
  'APPROVE',
  'REJECT',
  'EXPORT',
] as const

/** UI modules — filtered client-side against reference_type. */
export const auditModuleOptions = [
  'All Modules',
  'Roles',
  'Auth',
  'Settings',
  'Users',
] as const

export const colorOptions = [
  { value: 'var(--color-primary)', label: 'Primary (--color-primary)' },
  { value: 'var(--color-secondary)', label: 'Secondary (--color-secondary)' },
  { value: 'var(--color-tertiary)', label: 'Tertiary (--color-tertiary)' },
  { value: '#2563eb', label: 'Blue 600' },
  { value: '#16a34a', label: 'Green 600' },
  { value: '#ea580c', label: 'Orange 600' },
  { value: '#9333ea', label: 'Purple 600' },
  { value: '#dc2626', label: 'Red 600' },
  { value: '#0891b2', label: 'Cyan 600' },
  { value: '#db2777', label: 'Pink 600' },
]

export const languageOptions = [
  { value: 'English (US)', label: 'English (US)' },
  { value: 'English (UK)', label: 'English (UK)' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
]

export const timezoneOptions = [
  { value: 'UTC-05:00 Eastern Time', label: 'UTC-05:00 Eastern Time' },
  { value: 'UTC-06:00 Central Time', label: 'UTC-06:00 Central Time' },
  { value: 'UTC-07:00 Mountain Time', label: 'UTC-07:00 Mountain Time' },
  { value: 'UTC-08:00 Pacific Time', label: 'UTC-08:00 Pacific Time' },
  { value: 'UTC+00:00 UTC', label: 'UTC+00:00 UTC' },
  { value: 'UTC+01:00 CET', label: 'UTC+01:00 CET' },
  { value: 'UTC+05:30 IST', label: 'UTC+05:30 IST' },
  { value: 'UTC+08:00 CST', label: 'UTC+08:00 CST' },
  { value: 'UTC+09:00 JST', label: 'UTC+09:00 JST' },
]

export const currencyOptions = [
  { value: 'USD ($)', label: 'USD ($)' },
  { value: 'EUR (€)', label: 'EUR (€)' },
  { value: 'GBP (£)', label: 'GBP (£)' },
  { value: 'INR (₹)', label: 'INR (₹)' },
  { value: 'JPY (¥)', label: 'JPY (¥)' },
  { value: 'CNY (¥)', label: 'CNY (¥)' },
  { value: 'SGD ($)', label: 'SGD ($)' },
  { value: 'AUD ($)', label: 'AUD ($)' },
]

export const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
]

export const numberFormatOptions = [
  { value: '1,234.56', label: '1,234.56 (US/UK)' },
  { value: '1.234,56', label: '1.234,56 (EU)' },
  { value: '1 234,56', label: '1 234,56 (Space)' },
]

export const firstDayOptions = [
  { value: 'Sunday', label: 'Sunday' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Saturday', label: 'Saturday' },
]

export const dayOptions = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const weekKeys = ['organization', 'working-weeks'] as const
