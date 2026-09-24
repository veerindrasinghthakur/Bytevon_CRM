/** Central enum-style maps for my-work — semantic tokens only (no raw palette utilities). */
import { taskStatusSchema } from './task'

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
  Cancelled: 'bg-outline-variant',
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

/** Leave request status filter options (LeaveHistoryTab). */
export const LEAVE_STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
]

/** Leave type filter options — labels match the self-service mapping; the live
 * catalog comes from GET /my-work/leave/types (leave_types master). */
export const LEAVE_TYPE_OPTIONS = [
  { value: 'All', label: 'All Types' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Sick', label: 'Sick' },
  { value: 'Earned', label: 'Earned' },
  { value: 'Maternity', label: 'Maternity' },
  { value: 'Paternity', label: 'Paternity' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Comp Off', label: 'Comp Off' },
]

/** Attendance correction status filter options (AttendanceCorrectionsPage). */
export const CORRECTION_STATUS_OPTIONS = [
  { value: 'All', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Draft', label: 'Draft' },
]

/** Correction status badge colors (AttendanceCorrectionsPage). */
export const correctionStatusStyles: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
  Draft: 'bg-surface-container-high text-on-surface-variant',
}

/** Break duration presets in minutes (TakeABreakPage). */
export const BREAK_DURATION_PRESETS = [5, 10, 15, 30] as const

/** Request list filter options (MyRequestsPage). */
export const REQUEST_FILTERS = [
  'All Requests',
  'In-Progress',
  'Approved',
  'Rejected',
] as const

/** Task status dropdown options — derived from taskStatusSchema (single source). */
export const TASK_STATUS_OPTIONS = [
  { value: 'All', label: 'All status' },
  ...taskStatusSchema.options.map((s) => ({ value: s, label: s })),
]

export type TaskFilter = 'open' | 'inProgress' | 'high' | null
