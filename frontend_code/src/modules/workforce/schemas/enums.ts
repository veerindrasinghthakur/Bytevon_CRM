/** Workforce status / option maps — semantic tokens only (no raw palette). */

/** Org attendance dashboard / detail status pills */
export const workforceAttendanceStatusStyles: Record<string, string> = {
  PRESENT: 'status-badge status-success',
  LATE: 'status-badge status-warning',
  ABSENT: 'status-badge status-error',
  WFH: 'status-badge status-info',
  ON_LEAVE: 'status-badge status-info',
  'On Time': 'status-badge status-success',
  Late: 'status-badge status-warning',
  Remote: 'status-badge status-info',
}

export const WORKFORCE_ATTENDANCE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'WFH', label: 'WFH' },
  { value: 'ON_LEAVE', label: 'On leave' },
] as const

/** Employment lifecycle state badges (list + detail). */
export const employmentStateStyles: Record<string, string> = {
  CONFIRMED: 'status-badge status-success',
  ONBOARDING: 'status-badge status-info',
  PROBATION: 'status-badge status-warning',
  SERVING_NOTICE: 'status-badge status-warning',
  RESIGNED: 'status-badge status-neutral',
  TERMINATED: 'status-badge status-error',
  ALUMNI: 'status-badge status-neutral',
  ACTIVE: 'status-badge status-success',
  INACTIVE: 'status-badge status-neutral',
  ON_LEAVE: 'status-badge status-info',
}

/** Dot classes for QuickOverview / status indicators — semantic only. */
export const employmentStateDot: Record<string, string> = {
  CONFIRMED: 'bg-secondary',
  ONBOARDING: 'bg-secondary',
  PROBATION: 'bg-[var(--color-warning-amber)]',
  SERVING_NOTICE: 'bg-[var(--color-warning-amber)]',
  RESIGNED: 'bg-outline',
  TERMINATED: 'bg-error',
  ALUMNI: 'bg-outline',
  ACTIVE: 'bg-secondary',
  INACTIVE: 'bg-outline',
  ON_LEAVE: 'bg-secondary',
}

/** @deprecated Prefer employmentStateStyles — kept for compatibility */
export const employeeStatusStyles = employmentStateStyles

export const departmentStatusStyles: Record<string, string> = {
  ACTIVE: 'status-badge status-success',
  ARCHIVED: 'status-badge status-neutral',
}

export const loginEnabledClass = 'text-label-sm text-secondary font-medium'
export const loginDisabledClass = 'text-label-sm text-on-surface-variant font-medium'
