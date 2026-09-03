/** Central enum-style maps for my-work — semantic tokens only (no raw palette utilities). */

export const priorityClass: Record<string, string> = {
  Critical: 'status-badge status-error',
  High: 'status-badge status-error',
  Medium: 'status-badge status-neutral',
  Low: 'status-badge status-neutral',
}

export const statusDot: Record<string, string> = {
  'In Progress': 'bg-secondary',
  Pending: 'bg-outline',
  'Not Started': 'bg-outline',
  Completed: 'bg-secondary',
  Blocked: 'bg-[var(--color-warning-amber)]',
}

/** Leave / approval request status pills */
export const statusStyles: Record<string, string> = {
  'In-Progress': 'status-badge status-warning',
  Approved: 'status-badge status-success',
  Rejected: 'status-badge status-error',
  Pending: 'status-badge status-warning',
  Cancelled: 'status-badge status-neutral',
}

export const attendanceStatusStyles: Record<string, string> = {
  Present: 'status-badge status-success',
  Absent: 'status-badge status-error',
  'Half Day': 'status-badge status-warning',
  'On Leave': 'status-badge status-info',
  Holiday: 'status-badge status-neutral',
  Weekend: 'status-badge status-neutral',
}

/** Approval request type → material icon name */
export const approvalTypeIcon: Record<string, string> = {
  Leave: 'event_busy',
  'Attendance Correction': 'edit_calendar',
  Expense: 'payments',
  Other: 'description',
}

/** Alias used by MyApprovalsPage */
export const typeIcon = approvalTypeIcon

/** Manual attendance reason options (Mark Attendance). */
export const MANUAL_ATTENDANCE_REASONS = [
  { value: 'Client Meeting', label: 'Client Meeting' },
  { value: 'System Issue', label: 'System Issue' },
  { value: 'Forgot to Log', label: 'Forgot to Log' },
  { value: 'Travel', label: 'Travel' },
] as const
