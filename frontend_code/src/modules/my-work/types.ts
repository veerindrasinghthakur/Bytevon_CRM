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
