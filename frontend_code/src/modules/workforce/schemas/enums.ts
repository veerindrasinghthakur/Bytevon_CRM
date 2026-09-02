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

export const employeeStatusStyles: Record<string, string> = {
  ACTIVE: 'status-badge status-success',
  INACTIVE: 'status-badge status-neutral',
  ON_LEAVE: 'status-badge status-info',
  TERMINATED: 'status-badge status-error',
}

export const departmentStatusStyles: Record<string, string> = {
  ACTIVE: 'status-badge status-success',
  ARCHIVED: 'status-badge status-neutral',
}
