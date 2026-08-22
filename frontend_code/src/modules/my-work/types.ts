/** My Work (employee self-service) domain types */

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half Day'
  | 'On Leave'
  | 'Holiday'
  | 'Weekend'

export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Unpaid' | 'Comp Off'

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low'

export type TaskStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed' | 'Pending'

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected'

export type ApprovalType = 'Leave' | 'Attendance Correction' | 'Expense' | 'Other'

/** Break session (client-local until backend) */
export type BreakMode = 'countdown' | 'stopwatch'

export interface BreakSession {
  id: string
  mode: BreakMode
  /** ISO start */
  startedAt: string
  /** Minutes when mode is countdown; undefined for stopwatch */
  durationMinutes?: number
  /** ISO end when user stops the break */
  endedAt?: string
  note?: string
}

/** Position of a break segment inside a day bar (0–100 from bottom of bar height). */
export interface BreakBarMarker {
  id: string
  /** 0–100: start of break along the work window (bottom = start of day) */
  startPct: number
  /** 0–100: end of break; omit for a point marker */
  endPct?: number
}

export interface TodayAttendanceSession {
  /** ISO date YYYY-MM-DD */
  date: string
  /** ISO timestamp — exact check-in time */
  checkInAt: string
  /** ISO timestamp when checked out */
  checkOutAt?: string
}

export interface WorkHoursSummary {
  checkInAt: string
  checkOutAt?: string
  grossMs: number
  breakMs: number
  netMs: number
}

export interface MetricCard {
  id: string
  label: string
  value: string
  subtitle?: string
  icon: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

export interface AttendanceRecord {
  id: string
  date: string
  checkIn?: string
  checkOut?: string
  totalHours?: string
  status: AttendanceStatus
  shift?: string
  note?: string
}

export interface LeaveBalance {
  type: LeaveType
  used: number
  total: number
  remaining: number
}

/** Policy-defined leave type (from leave policies / settings) */
export interface LeaveTypeOption {
  id: string
  name: LeaveType | string
  code: string
  annualEntitlement: number
  description?: string
}

export interface LeaveRequest {
  id: string
  type: LeaveType
  from: string
  to: string
  days: number
  reason: string
  status: LeaveStatus
  appliedOn: string
  approver?: string
  halfDay?: 'start' | 'end' | 'both' | null
}

export interface MyTask {
  id: string
  name: string
  project?: string
  priority: TaskPriority
  dueDate: string
  status: TaskStatus
  estimatedHours?: string
}

export interface ApprovalRequest {
  id: string
  type: ApprovalType
  title: string
  submittedOn: string
  status: ApprovalStatus
  summary?: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
  icon: string
  tag?: string
}

export interface UpcomingEvent {
  id: string
  title: string
  subtitle: string
  month: string
  day: string
  icon: string
}

export type CorrectionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Draft'

export interface AttendanceCorrectionRequest {
  id: string
  date: string
  originalStatus: string
  requestedCheckIn: string
  requestedCheckOut: string
  reason: string
  status: CorrectionStatus
  submittedOn: string
  approver: string
  approverId?: string
}

export interface ApproverOption {
  id: string
  name: string
  title: string
  department?: string
}

export type BankAccountType = 'Savings' | 'Current' | 'Salary'

export interface BankDetails {
  id?: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  confirmAccountNumber?: string
  ifscOrRouting: string
  branchName: string
  accountType: BankAccountType
  country: string
  currency: string
}

export interface WeekHourBar {
  day: string
  hours: number
  pct: number
  isToday: boolean
  isWeekend: boolean
  /** Red break markers drawn on the bar (multiple per day if multiple breaks) */
  breakMarkers?: BreakBarMarker[]
}
