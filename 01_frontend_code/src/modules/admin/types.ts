/** Administration domain types — interfaces + schema re-exports */

export type {
  AdminUserListItemSchema,
  CreateUserLoginInput,
  UserFormInput,
} from './schemas/users'
export type { AdminRoleSchema, RoleFormInput } from './schemas/roles'
export type { LeaveAccrualPolicyInput, LeavePolicyFormInput, LeaveTypeForm } from './schemas/leave'
export type {
  OrganizationProfileInput,
  AttendanceSettingsInput,
  OrganizationSettingsForm,
  BrandingForm,
  RegionalForm,
} from './schemas/settings'

export type RoleStatusFilter = 'All' | 'Active' | 'Archived'
export type RoleCategoryFilter = 'All' | 'Core Role' | 'Operational' | 'Financial' | 'Standard'
export type RoleFormMode = 'create' | 'edit'
export type AdminUserStatus = 'Active' | 'Inactive' | 'Locked'

export interface RoleFormProps {
  mode: RoleFormMode
  roleId?: string
  duplicateFromId?: string
}

export type AdminRoleStatus = 'Active' | 'Archived'
export type AdminRoleCategory = 'Core Role' | 'Operational' | 'Financial' | 'Standard'
export type SecurityEventStatus = 'Success' | 'Blocked' | 'Warning'

export interface AdminRole {
  id: string
  name: string
  description: string
  usersCount: number
  permissions: string[]
  status: AdminRoleStatus
  category: AdminRoleCategory
  coveragePct: number
  coverageLabel: string
  created: string
  updated: string
}

export interface AuditLog {
  id: string
  action: string
  description: string
  referenceType: string
  referenceId: number | null
  employmentId: number | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  timestamp: string
  actor: string
  actorInitials: string
  target: string
  module: string
  ip: string
}

export interface SecurityEvent {
  id: string
  eventType: string
  identity: string
  employmentId: number | null
  source: string
  ipAddress: string | null
  referenceType: string
  description: string
  timestamp: string
  status: SecurityEventStatus
}

export interface LeaveTypeSettingRow {
  name: string
  desc: string
  days: string
  eligibility: string
  eligibilityStyle: string
}

export interface LeavePolicyRow {
  id: number
  name: string
  leave_type: string
  annual_entitlement: number
  carry_forward_limit: number
  effective_from: string
  effective_to: string | null
}

export interface LeaveLedgerRow {
  id: number
  leave_type: string
  transaction_type: string
  days: number
  reference_type: string
  created_at: string
}

export interface OfficeLocation {
  id: string
  name: string
  country: string
  city: string
  timezone: string
  currency: string
  fiscal: string
  address: string
  postal: string
}

export interface OrganizationProfile {
  name: string
  legal: string
  email: string
  phone: string
  website: string
  tax: string
  reg: string
  description: string
  defaultTimezone?: string
  defaultCurrency?: string
  headOfficeLocationId?: number | null
  logoReference?: string | null
}

/** UI + mapped AttendancePolicy (GET/POST /attendance/policies). */
export interface AttendanceSettings {
  shiftStart: string
  shiftEnd: string
  graceMinutes: number
  earlyOutMinutes: number
  otMinMinutes: number
  allowRemoteCheckIn: boolean
  correctionWindowDays: number
  maxCorrectionsPerMonth: number | null
  reasonsMandatory: boolean
  approvalSlaHours: number | null
  allowMultiplePunches: boolean
  requireCheckoutBeforeNewCheckin: boolean
  autoCreateAttendanceDay: boolean
  maxClockDriftSeconds: number | null
  policyName?: string
  policyId?: number | null
  effectiveFrom?: string | null
}

export interface LeaveAccrualPolicy {
  maxCarryOverDays: number
  minimumNoticeDays: number
}

export type RolePermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'EXPORT'
  | 'UNLOCK'

export interface RbacResource {
  id: number
  name: string
  description?: string | null
}

export interface RbacPermission {
  id: number
  resource_id: number
  resource_name: string
  action: RolePermissionAction
}

export interface PermissionCatalog {
  modules: string[]
  actions: RolePermissionAction[]
  resources: RbacResource[]
  permissions: RbacPermission[]
}

export type RolePermissionMatrix = Record<string, Record<string, boolean>>

export interface AdminUserListItem {
  id: number
  employmentId: number
  name: string
  email: string
  role: string
  department: string
  status: 'Active' | 'Inactive' | 'Locked'
  lastLogin: string
  lastLoginAt: string | null
  initials: string
  employeeCode: string
}

export interface EmploymentWithoutLogin {
  employmentId: number
  employeeCode: string
  name: string
  department: string
  position: string
  joiningDate: string
}

export interface RecordAuditInput {
  action: string
  target: string
  module: string
  actor?: string
  actorInitials?: string
  ip?: string
}

export interface AdminHubMetrics {
  users: number
  roles: number
  activeSessions: number
  auditEventsToday: number
  configHealth: string
  offices: number
  departments: number
  employees: number
  shifts?: number
  securityScore?: number
  mfaAdoption?: number
  openAlerts?: number
}

export type AdminKpis = AdminHubMetrics

export interface RoleListMetrics {
  totalRoles: number
  activeRoles: number
  activeUsers: number
  archivedRoles: number
}

export interface LeaveAdminMetrics {
  leaveTypes: number
  pendingRequests: number
  approvedThisMonth: number
  avgBalanceDays: number
}

export interface AttendanceAdminMetrics {
  presentToday: number
  lateToday: number
  onLeaveToday: number
  remoteCheckIns: number
  /** Config KPIs when live day stats are unavailable */
  activeShifts?: number
  graceMinutes?: number
  correctionWindowDays?: number
}

export interface AuditListParams {
  limit?: number
  search?: string
  action?: string
  module?: string
  dateFrom?: string
  dateTo?: string
  timeFrom?: string
  timeTo?: string
}

export interface AuditFilters {
  [key: string]: string
  action: string
  module: string
  dateFrom: string
  dateTo: string
  timeFrom: string
  timeTo: string
}

export type OfficeWriteInput = {
  name: string
  country: string
  city: string
  timezone: string
  currency: string
  fiscal: string
  address: string
  postal: string
}

export interface AdminRoleOption {
  id: string
  name: string
  description?: string | null
}

export interface DepartmentOption {
  id: number
  name: string
}

export type AdminUserListParams = {
  search?: string
  status?: string
  department?: string
  role?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}
