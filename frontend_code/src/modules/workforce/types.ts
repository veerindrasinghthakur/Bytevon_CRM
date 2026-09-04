/** Re-export domain types from Zod schemas — MODULE_STANDARDS (my-work pattern). */

import type { DepartmentListItem } from './schemas/department'

export type {
  DepartmentListItemSchema,
  DepartmentListItem,
  DepartmentEmployeeSchema,
  DepartmentEmployee,
  CreateDepartmentInput,
  DepartmentFormInput,
} from './schemas/department'

export type { DepartmentListResponse } from './schemas/department-list-response'

export {
  departmentFormSchema,
  emptyDepartmentForm,
  toCreateDepartmentInput,
  departmentListItemSchema,
  createDepartmentSchema,
} from './schemas/department'

export { departmentListResponseSchema } from './schemas/department-list-response'

export type {
  EmploymentListItemSchema,
  CreateEmploymentSchemaInput,
  EmploymentFormInput,
} from './schemas/employment'

export type { EmploymentListResponse } from './schemas/employment-list-response'

export {
  employmentFormSchema,
  emptyEmploymentForm,
  toCreateEmploymentInput,
  employmentStateSchema,
  employmentListItemSchema,
  createEmploymentSchema,
} from './schemas/employment'

export { employmentListResponseSchema } from './schemas/employment-list-response'

export {
  employeeDetailEditSchema,
  type EmployeeDetailEditInput,
} from './schemas/employment-form'

export type {
  RecordStatus,
  DepartmentRole,
  Team,
  TeamMember,
  WorkforceMetric,
  Department,
  Employee,
  EmploymentType,
  EmployeeStatus,
  TeamEditFormInput,
} from './schemas/team'

export type Crumb = { label: string; to?: string }
export type CrumbsFromPathOptions = { labelOverrides?: Record<string, string>; rootTo?: string }
export type RouteCrumbsProps = { items: Crumb[]; className?: string }
export type DynamicRouteCrumbsProps = {
  lastLabel?: string
  labelOverrides?: Record<string, string>
  className?: string
}
export type TeamTopTab = 'overview' | 'members' | 'projects'
export type TeamTopTabItem = { id: TeamTopTab; label: string; to: string }

export type DeptMetrics = {
  total: number
  active: number
  inactive: number
  staffing: number
}

export type DeptListResult = {
  items: DepartmentListItem[]
  total: number
  metrics?: DeptMetrics
}

export type WorkforceShiftsListParams = {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export type AddMemberMode = 'choose' | 'existing' | 'new'
export type CandidateMember = {
  id: string
  name: string
  title?: string
  department?: string
  experienceYears?: number
  joinedLabel?: string
  availability: string
}
export type RosterRow = {
  id: number
  employee_code: string
  fullName: string
  departmentName: string
  status: string
}
export type EmployeeCreateStep = 'profile' | 'auth' | 'done'
export type EmployeeCreateMasters = {
  departments: { id: number; name: string }[]
  positions: { id: number; name: string }[]
  locations: { id: number; name: string }[]
  shifts: { id: number; name: string }[]
}
export type ManagerOption = { id: number; name: string }
export type IdName = { id: number; name: string }

export {
  workforceAttendanceStatusStyles,
  WORKFORCE_ATTENDANCE_STATUS_OPTIONS,
  employmentStateStyles,
  employmentStateDot,
  employeeStatusStyles,
  departmentStatusStyles,
  loginEnabledClass,
  loginDisabledClass,
} from './schemas/enums'

export { teamEditFormSchema, emptyTeamEditForm } from './schemas/team'


export interface AttendanceKpi {
  key: string
  label: string
  value: number
  hint: string
  icon: string
}

export interface WeeklyAttendancePoint {
  day: string
  thisWeek: number
  lastWeek: number
}

export interface RecentCheckIn {
  id: string
  name: string
  team: string
  time: string
  status: string
}

export interface TodayAttendanceRow {
  id: string
  name: string
  avatar: string
  department: string
  checkIn: string
  checkOut: string
  status: string
  hours: string
}

export interface CorrectionRow {
  id: string
  name: string
  ago: string
  note: string
  status: string
}

export interface AttendanceLogRow {
  time: string
  action: string
  duration: string
  status: string
  location: string
}

export interface AttendanceDashboardData {
  kpis: AttendanceKpi[]
  weekly: WeeklyAttendancePoint[]
  recentCheckIns: RecentCheckIn[]
  today: TodayAttendanceRow[]
  corrections: CorrectionRow[]
}

export interface AttendanceDetailData {
  row: TodayAttendanceRow
  logs: AttendanceLogRow[]
}

export interface AttendanceDayDetailData {
  employmentId: string
  date: string
  punches: AttendancePunch[]
  breaks: AttendanceBreak[]
  workingHours: number
}

export interface AttendancePunch {
  id: number
  punch_type: string
  punch_time: string
  is_valid_punch: boolean
  client_ip: string
  validation_message: string | null
}

export interface AttendanceBreak {
  id: number
  start: string
  end: string
  duration_min: number
}

export interface LegacyEmployee {
  id: number
  userId?: number | null
  employeeCode: string
  fullName: string
  email: string
  department?: string
  role?: string
  status: string
  joiningDate?: string
  workType?: string
}

export interface LegacyDepartment {
  id: number
  name: string
  code?: string
  headName?: string | null
  employeeCount: number
  status: string
  createdAt: string
}

export type ShiftMock = {
  id: string
  name: string
  code: string
  startTime: string
  endTime: string
  breakMinutes: number
  days: string
  status: 'Active' | 'Inactive'
  employeeCount: number
  description?: string
}

export type ShiftEmployeeMock = {
  id: string
  name: string
  title: string
  department: string
  status: 'Active' | 'On Leave'
}

export interface DepartmentMetricInput {
  status: string
  staffCount?: number
}

export interface EmploymentMetricInput {
  current_state: string
}