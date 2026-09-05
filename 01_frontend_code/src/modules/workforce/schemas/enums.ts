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

export const TEAM_FILTER_DEFAULTS = {
  status: 'All',
  department: 'All',
}

export const EMPLOYMENT_STATES = [
  'ONBOARDING',
  'PROBATION',
  'CONFIRMED',
  'SERVING_NOTICE',
  'RESIGNED',
  'TERMINATED',
  'ALUMNI',
] as const

export const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'INTERN',
  'CONTRACTOR',
  'CONSULTANT',
] as const

export const WORKFORCE_SHIFT_STATUS_OPTIONS = ['All', 'Active', 'Inactive'] as const
export type WorkforceShiftStatus = (typeof WORKFORCE_SHIFT_STATUS_OPTIONS)[number]
export const WORKFORCE_SHIFT_FILTER_DEFAULTS = {
  status: 'All' as WorkforceShiftStatus,
}

export const WORKFORCE_ROUTE_SEGMENT_LABELS: Record<string, string> = {
  workforce: 'Workforce', employees: 'Employees', departments: 'Departments', teams: 'Teams', attendance: 'Attendance',
  members: 'Members', projects: 'Project History', edit: 'Edit', 'add-member': 'Add Member',
  'assign-project': 'Assign Project', new: 'New', sales: 'Sales', projects_mod: 'Projects', 'my-work': 'My Work',
  leave: 'Leave', approvals: 'Approvals', admin: 'Administration',
}

export const WORKFORCE_TEAM_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'projects', label: 'Project History' },
] as const

export const WORKFORCE_TEAM_METRICS = [
  { id: 'members', label: 'Total Members', icon: 'group', change: '12%' },
  { id: 'projects', label: 'Projects Delivered', icon: 'check_circle', change: '4%' },
  { id: 'velocity', label: 'Current Velocity', icon: 'speed', change: '2%' },
  { id: 'completion', label: 'Avg. Task Completion', icon: 'timer' },
] as const

export const TEAM_PROJECT_ROLE_OPTIONS = [
  { value: 'Primary', label: 'Primary' },
  { value: 'Support', label: 'Support' },
  { value: 'Consulting', label: 'Consulting' },
] as const

export const WORK_MODE_OPTIONS = [
  { value: 'OFFICE', label: 'OFFICE' },
  { value: 'WFH', label: 'WFH' },
] as const

export const GENDER_OPTIONS = [
  { value: '', label: 'Select…' },
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
] as const

export const DEPARTMENT_ROLE_OPTIONS = [
  { value: 'Lead', label: 'Lead' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Junior', label: 'Junior' },
] as const

export const DEPARTMENT_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
] as const

export const SHIFT_STATUS_OPTIONS = [
  { value: 'All', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
] as const

export const WORKFORCE_ROSTER_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'WFH', 'ON_LEAVE'] as const
