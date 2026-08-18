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

/** Seeded RBAC resource names used by can() */
export const ResourceName = {
  EMPLOYMENT: 'employment',
  DEPARTMENT: 'department',
  LOCATION: 'location',
  ROLE: 'role',
  USER: 'user',
  LEAVE_REQUEST: 'leave_request',
  LEAVE_POLICY: 'leave_policy',
  ATTENDANCE: 'attendance',
  PAYROLL: 'payroll',
  SALARY: 'salary',
  PROJECT: 'project',
  TASK: 'task',
  LEAD: 'lead',
  CLIENT: 'client',
  APPROVAL: 'approval',
  AUDIT: 'audit',
  NOTIFICATION: 'notification',
  ORG_SETTINGS: 'org_settings',
  SHIFT: 'shift',
  HOLIDAY: 'holiday',
  DOCUMENT: 'document',
  NOTE: 'note',
} as const
export type ResourceName = (typeof ResourceName)[keyof typeof ResourceName]
