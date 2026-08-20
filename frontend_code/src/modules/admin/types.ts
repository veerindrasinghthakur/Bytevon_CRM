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
