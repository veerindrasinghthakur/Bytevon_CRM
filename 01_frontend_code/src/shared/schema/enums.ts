/**
 * Schema enums — mirror Complete_Final_Schema.md.
 * UI and API layers must use these only (no ad-hoc status strings).
 */

export const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  INTERN: 'INTERN',
  CONTRACTOR: 'CONTRACTOR',
  CONSULTANT: 'CONSULTANT',
} as const
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType]

export const EmploymentState = {
  ONBOARDING: 'ONBOARDING',
  PROBATION: 'PROBATION',
  CONFIRMED: 'CONFIRMED',
  SERVING_NOTICE: 'SERVING_NOTICE',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED',
  ALUMNI: 'ALUMNI',
} as const
export type EmploymentState = (typeof EmploymentState)[keyof typeof EmploymentState]

export const WorkMode = {
  OFFICE: 'OFFICE',
  WFH: 'WFH',
} as const
export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode]

export const Action = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  EXPORT: 'EXPORT',
  /** Unlock locked login accounts */
  UNLOCK: 'UNLOCK',
} as const
export type Action = (typeof Action)[keyof typeof Action]

export const ScopeName = {
  SELF: 'SELF',
  TEAM: 'TEAM',
  DEPARTMENT: 'DEPARTMENT',
  LOCATION: 'LOCATION',
  ORGANIZATION: 'ORGANIZATION',
  CUSTOM: 'CUSTOM',
} as const
export type ScopeName = (typeof ScopeName)[keyof typeof ScopeName]

export const LeaveType = {
  CASUAL: 'CASUAL',
  SICK: 'SICK',
  EARNED: 'EARNED',
  MATERNITY: 'MATERNITY',
  PATERNITY: 'PATERNITY',
  LOSS_OF_PAY: 'LOSS_OF_PAY',
  COMP_OFF: 'COMP_OFF',
} as const
export type LeaveType = (typeof LeaveType)[keyof typeof LeaveType]

export const LeaveRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const
export type LeaveRequestStatus = (typeof LeaveRequestStatus)[keyof typeof LeaveRequestStatus]

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  HALF_DAY: 'HALF_DAY',
  HOLIDAY: 'HOLIDAY',
  WEEK_OFF: 'WEEK_OFF',
  ON_LEAVE: 'ON_LEAVE',
} as const
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]

export const PunchType = {
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
} as const
export type PunchType = (typeof PunchType)[keyof typeof PunchType]

export const AttendanceCorrectionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const
export type AttendanceCorrectionStatus =
  (typeof AttendanceCorrectionStatus)[keyof typeof AttendanceCorrectionStatus]

export const PayrollStatus = {
  CALCULATED: 'CALCULATED',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
} as const
export type PayrollStatus = (typeof PayrollStatus)[keyof typeof PayrollStatus]

export const SalaryItemType = {
  EARNING: 'EARNING',
  DEDUCTION: 'DEDUCTION',
} as const
export type SalaryItemType = (typeof SalaryItemType)[keyof typeof SalaryItemType]

export const PayrollItemType = {
  EARNING: 'EARNING',
  DEDUCTION: 'DEDUCTION',
  ADJUSTMENT: 'ADJUSTMENT',
} as const
export type PayrollItemType = (typeof PayrollItemType)[keyof typeof PayrollItemType]

export const SessionStatus = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]

export const DeviceType = {
  DESKTOP: 'DESKTOP',
  MOBILE: 'MOBILE',
  TABLET: 'TABLET',
  OTHER: 'OTHER',
} as const
export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType]

/**
 * Polymorphic note targets (schema locked: no PROJECT).
 * Notes attach to LEAD | TASK | CLIENT only.
 */
export const NoteReferenceType = {
  LEAD: 'LEAD',
  TASK: 'TASK',
  CLIENT: 'CLIENT',
} as const
export type NoteReferenceType = (typeof NoteReferenceType)[keyof typeof NoteReferenceType]

/**
 * RBAC resource name — plain string, NOT an enum.
 *
 * Single source of truth is the backend `resources` table (seeded) served via
 * `GET /rbac/resources` and embedded in effective-permissions grants. The
 * frontend never enumerates resources; it passes the lowercase backend name
 * (e.g. 'employment', 'leave_request') straight through to can()/Can/requireView.
 */
export type ResourceName = string

// ---------------------------------------------------------------------------
// LeaveType — single source of truth.
// To add/change a leave type, edit the LeaveType const above only.
// All dropdowns/mocks below derive from it via the helpers.
// ---------------------------------------------------------------------------

/** Display label for a canonical LeaveType code (single place to change). */
export function leaveTypeLabel(code: string): string {
  const key = (code ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  const labels: Record<string, string> = {
    CASUAL: 'Casual',
    SICK: 'Sick',
    EARNED: 'Earned',
    MATERNITY: 'Maternity',
    PATERNITY: 'Paternity',
    LOSS_OF_PAY: 'Unpaid',
    COMP_OFF: 'Comp Off',
  }
  return labels[key] ?? (code ?? '')
}

/** Canonical dropdown options derived from the LeaveType enum. */
export function leaveTypeOptions(): Array<{ value: LeaveType; label: string }> {
  return (Object.values(LeaveType) as LeaveType[]).map((value) => ({
    value,
    label: leaveTypeLabel(value),
  }))
}
