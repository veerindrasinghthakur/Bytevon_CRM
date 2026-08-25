/** Re-export domain types from Zod schemas — MODULE_STANDARDS §3.4 */

export type {
  LeaveType,
  LeaveStatus,
  LeaveBalance,
  LeaveTypeOption,
  LeaveRequest,
  CreateLeaveRequestInput,
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
