/** Re-export domain types from Zod schemas — MODULE_STANDARDS §3.4 */

export type {
  LeaveType,
  LeaveStatus,
  LeaveBalance,
  LeaveTypeOption,
  LeaveRequest,
  CreateLeaveRequestInput,
  HolidayItem,
  ApplyLeaveContext,
  LeaveCalculateInput,
  LeaveCalculateResult,
} from './schemas/leave'

export type { LeaveListResponse } from './schemas/leave-list-response'

export type { LeaveFormValues } from './schemas/leave-form'
export { emptyLeaveForm, leaveFormSchema } from './schemas/leave-form'

export type {
  AttendanceStatus,
  AttendanceRecord,
  CorrectionStatus,
  AttendanceCorrectionRequest,
  BreakBarMarker,
  WeekHourBar,
  TodayAttendanceSession,
  WorkHoursSummary,
} from './schemas/attendance'

export type { AttendanceListResponse } from './schemas/attendance-list-response'
export type { CorrectionListResponse } from './schemas/correction-list-response'

export type {
  TaskPriority,
  TaskStatus,
  MyTask,
  CreateMyTaskInput,
} from './schemas/task'

export type { MyTaskListResponse } from './schemas/task-list-response'

export type { MyTaskFormValues } from './schemas/task-form'
export { emptyMyTaskForm, myTaskFormSchema } from './schemas/task-form'

export type {
  ApprovalStatus,
  ApprovalType,
  ApprovalRequest,
  ApproverOption,
} from './schemas/approval'

export type { ApprovalListResponse } from './schemas/approval-list-response'

export type { BankAccountType, BankDetails } from './schemas/bank'
export type { BankFormValues } from './schemas/bank-form'
export { emptyBankForm, bankFormSchema } from './schemas/bank-form'

export type {
  MetricCard,
  NotificationItem,
  UpcomingEvent,
  MyWorkUser,
  MyWorkOverview,
} from './schemas/overview'

export type { CorrectionFormValues } from './schemas/correction-form'
export { emptyCorrectionForm, correctionFormSchema } from './schemas/correction-form'

export type { BreakMode, BreakSession } from './schemas/break'

export type { WorkLogRow, BreakSeg } from './schemas/working-hours-log'

export {
  priorityClass,
  statusDot,
  statusStyles,
  attendanceStatusStyles,
  approvalTypeIcon,
  typeIcon,
  MANUAL_ATTENDANCE_REASONS,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  CORRECTION_STATUS_OPTIONS,
  correctionStatusStyles,
  BREAK_DURATION_PRESETS,
  REQUEST_FILTERS,
} from './schemas/enums'

import type {LeaveStatus} from './schemas/leave'

export type LeaveHistoryRow = {
  id: string
  type: string
  from: string
  to: string
  days: number
  reason: string
  status: LeaveStatus
  appliedOn: string
}

/** Tab options for MyLeavePage. */
export type LeavePageTab = 'balance' | 'history' | 'calendar'