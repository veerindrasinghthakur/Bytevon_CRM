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

/** Role permission matrix */
export const ROLE_ACTIONS = [
  'View',
  'Create',
  'Edit',
  'Delete',
  'Approve',
  'Export',
  'Import',
  'Manage',
] as const

export type RolePermissionAction = (typeof ROLE_ACTIONS)[number]

export const ROLE_MODULES = [
  'Dashboard',
  'Employees',
  'CRM',
  'Sales',
  'Inventory',
  'Reports',
  'Administration',
  'Attendance',
  'Leave',
  'Payroll',
] as const

export type RolePermissionModule = (typeof ROLE_MODULES)[number]

export type RolePermissionMatrix = Record<
  string,
  Record<RolePermissionAction, boolean>
>
