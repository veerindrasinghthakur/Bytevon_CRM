/**
 * Core schema row shapes used by mock seed + API layer.
 * Keep aligned with Complete_Final_Schema.md.
 */

import type {
  Action,
  AttendanceStatus,
  EmploymentState,
  EmploymentType,
  LeaveType,
  PayrollStatus,
  PunchType,
  SalaryItemType,
  ScopeName,
  WorkMode,
} from './enums'

export type {
  Action,
  AttendanceStatus,
  EmploymentState,
  EmploymentType,
  LeaveType,
  PayrollStatus,
  PunchType,
  SalaryItemType,
  ScopeName,
  WorkMode,
}

export interface OrganizationSettings {
  id: number
  company_name: string
  head_office_location_id: number
  default_timezone: string
  default_currency: string
  logo_reference: string | null
  created_at: string
  updated_at: string
  changed_by: number
}

export interface LocationRow {
  id: number
  name: string
  timezone: string
  working_week_id: number
  holiday_calendar_id: number
  latitude: number
  longitude: number
  attendance_radius_meters: number
  allowed_ip_cidrs: string[]
  country: string
  state: string
  city: string
  address: string
  payroll_region: string | null
  currency: string
  fiscal_year_start_month: number
  is_archived: boolean
  archived_at: string | null
  archived_by: number | null
  created_at: string
  updated_at: string
  changed_by: number
}

export interface DepartmentRow {
  id: number
  name: string
  department_head_employment_id: number | null
  is_archived: boolean
  created_at: string
  created_by: number
}

export interface WorkingWeekRow {
  id: number
  name: string
  working_days_of_week: number[]
  effective_from: string
  effective_to: string | null
  created_at: string
  created_by: number
}

export interface ShiftRow {
  id: number
  name: string
  start_time: string
  end_time: string
  is_overnight: boolean
  grace_late_minutes: number
  flexible_end: boolean
  break_duration_minutes: number | null
  is_archived: boolean
  created_at: string
  updated_at: string
  changed_by: number
}

export interface HolidayCalendarRow {
  id: number
  name: string
  is_archived: boolean
  created_at: string
  updated_at: string
  changed_by: number
}

export interface HolidayRow {
  id: number
  holiday_calendar_id: number
  name: string
  date: string
  holiday_type: 'NATIONAL' | 'REGIONAL' | 'OPTIONAL' | 'COMPANY'
  recurring_flag: boolean
  created_at: string
  changed_by: number
}

export interface PositionRow {
  id: number
  name: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface PersonRow {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string | null
  personal_email: string | null
  personal_phone: string | null
  address: string | null
  is_anonymized: boolean
  anonymized_at: string | null
  created_at: string
  updated_at: string
}

export interface EmploymentRow {
  id: number
  person_id: number
  employee_code: string
  employment_type: EmploymentType
  current_state: EmploymentState
  joining_date: string
  created_at: string
  updated_at: string
  changed_by: number
}

export interface EmploymentStateHistoryRow {
  id: number
  employment_id: number
  previous_state: EmploymentState | null
  new_state: EmploymentState
  effective_date: string
  reason: string | null
  created_at: string
  changed_by: number
}

export interface EmploymentAssignmentRow {
  id: number
  employment_id: number
  department_id: number
  position_id: number
  location_id: number
  shift_id: number
  work_mode: WorkMode
  effective_from: string
  effective_to: string | null
  change_reason: string
  created_at: string
  changed_by: number
}

export interface ResourceRow {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface PermissionRow {
  id: number
  resource_id: number
  action: Action
  created_at: string
}

export interface ScopeRow {
  id: number
  name: ScopeName
  description: string | null
  created_at: string
}

export interface RoleRow {
  id: number
  name: string
  description: string | null
  is_system_role: boolean
  created_at: string
  changed_by: number
}

export interface RolePermissionRow {
  role_id: number
  permission_id: number
  scope_id: number
  created_at: string
  changed_by: number
}

export interface EmployeeRoleRow {
  employment_id: number
  role_id: number
  assigned_at: string
  changed_by: number
}

export interface EmployeeSalaryRow {
  id: number
  employment_id: number
  effective_from: string
  effective_to: string | null
  gross_salary: number
  created_at: string
  updated_at: string
  changed_by: number
}

export interface EmployeeSalaryItemRow {
  id: number
  employee_salary_id: number
  name: string
  type: SalaryItemType
  amount: number
  created_at: string
  updated_at: string
  changed_by: number
}

export interface MonthlyPayrollRow {
  id: number
  employment_id: number
  year: number
  month: number
  gross_salary: number
  total_earnings: number
  total_deductions: number
  net_salary: number
  status: PayrollStatus
  payment_method: string | null
  payment_reference: string | null
  payment_date: string | null
  created_at: string
  updated_at: string
  changed_by: number
}

export interface EmployeeBankAccountRow {
  id: number
  employment_id: number
  account_holder_name: string
  bank_name: string
  account_number: string
  ifsc_code: string
  account_type: 'SAVINGS' | 'CURRENT'
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  changed_by: number | null
}

/** Login / auth identity linked 1:1 to employment (schema: logins). */
export interface LoginUserRow {
  id: number
  employment_id: number
  email: string
  /** Mock only — never store real passwords in production */
  temporary_password: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'
  failed_attempt_count: number
  locked_until: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

/** Aggregated employee detail for UI (API DTO, not a table). */
export interface EmployeeDetailDto {
  employment: EmploymentRow
  person: PersonRow
  currentAssignment: EmploymentAssignmentRow | null
  department: DepartmentRow | null
  position: PositionRow | null
  location: LocationRow | null
  shift: ShiftRow | null
  stateHistory: EmploymentStateHistoryRow[]
  assignmentHistory: EmploymentAssignmentRow[]
  roleIds: number[]
  roleNames: string[]
  currentSalary: EmployeeSalaryRow | null
  hasLogin: boolean
  loginEmail: string | null
}
