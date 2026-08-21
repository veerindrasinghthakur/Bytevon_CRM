/** Administration domain types */

export type AdminUserStatus = 'Active' | 'Inactive' | 'Locked'
export type AdminRoleStatus = 'Active' | 'Archived'
export type AdminRoleCategory = 'Core Role' | 'Operational' | 'Financial' | 'Standard'
export type SecurityEventStatus = 'Success' | 'Blocked' | 'Warning'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: AdminUserStatus
  lastLogin: string
  initials: string
}

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
  actor: string
  actorInitials: string
  target: string
  module: string
  timestamp: string
  ip: string
}

export interface SecurityEvent {
  id: string
  eventType: string
  identity: string
  source: string
  timestamp: string
  status: SecurityEventStatus
}

export interface AdminKpis {
  users: number
  roles: number
  activeSessions: number
  auditEventsToday: number
  configHealth: 'Good' | 'Warning' | 'Critical'
  securityScore: number
  mfaAdoption: number
  openAlerts: number
}

/** Leave settings UI row (display labels from settings page) */
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

/** Organisation profile — company identity (settings server state) */
export interface OrganizationProfile {
  name: string
  legal: string
  email: string
  phone: string
  website: string
  tax: string
  reg: string
  description: string
}

/** Attendance company policy (settings server state) */
export interface AttendanceSettings {
  shiftStart: string
  shiftEnd: string
  graceMinutes: number
  earlyOutMinutes: number
  otMinMinutes: number
  allowRemoteCheckIn: boolean
}

/** Leave accrual company policy (settings server state) */
export interface LeaveAccrualPolicy {
  maxCarryOverDays: number
  minimumNoticeDays: number
}

/**
 * RBAC catalog — modules = resources.name from DB (seeded).
 * Actions = Action enum values from backend (seeded permissions).
 * Do NOT hardcode for production matrix; fetch via listPermissionCatalog().
 */

/** Backend Action enum (aligned with app.core.db.enums.Action) */
export type RolePermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'EXPORT'

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

/** Catalog used to build the role permission matrix UI */
export interface PermissionCatalog {
  /** Resource names (modules) — order stable for matrix columns/rows */
  modules: string[]
  /** Distinct actions present across permissions (usually full Action enum) */
  actions: RolePermissionAction[]
  resources: RbacResource[]
  permissions: RbacPermission[]
}

export type RolePermissionMatrix = Record<string, Record<string, boolean>>
