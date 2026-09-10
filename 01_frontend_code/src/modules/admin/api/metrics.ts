/** Admin / org metric aggregates for hub, roles, leave, attendance. */

import { env } from '@/config/env'
import { adminKpis, adminRoles, offices } from '../data/mock'
import type {
  AdminHubMetrics,
  RoleListMetrics,
  LeaveAdminMetrics,
  AttendanceAdminMetrics,
} from '../types'
import { getDb, delay } from '@/shared/mock/db'
import { listAdminRoles } from './roles'

/**
 * Backend does not expose /admin/metrics/* yet.
 * Role KPIs are derived from GET /rbac/roles (no 404 noise).
 * Hub / leave / attendance use safe defaults until dedicated APIs exist.
 */

export async function getAdminHubMetrics(): Promise<AdminHubMetrics> {
  if (env.useMockApi) {
    await delay()
    const db = getDb()
    return {
      users: adminKpis.users,
      roles: adminKpis.roles,
      activeSessions: adminKpis.activeSessions,
      auditEventsToday: adminKpis.auditEventsToday,
      configHealth: adminKpis.configHealth,
      offices: offices.length,
      departments: db.schema_departments?.length ?? 5,
      employees: db.employments?.length ?? 6,
      shifts: db.shifts?.filter((s) => !s.is_archived).length ?? 0,
    }
  }

  // No /admin/metrics/hub on backend — keep UI stable with zeros
  return {
    users: 0,
    roles: 0,
    activeSessions: 0,
    auditEventsToday: 0,
    configHealth: 'unknown',
    offices: 0,
    departments: 0,
    employees: 0,
    shifts: 0,
  }
}

export async function getRoleListMetrics(): Promise<RoleListMetrics> {
  if (env.useMockApi) {
    await delay()
    const db = getDb()
    const logins = (db as { login_users?: Array<{ status?: string }> }).login_users ?? []
    const active = adminRoles.filter((r) => r.status === 'Active')
    return {
      totalRoles: adminRoles.length,
      activeRoles: active.length,
      activeUsers: logins.filter((l) => l.status === 'ACTIVE').length,
      archivedRoles: adminRoles.filter((r) => r.status === 'Archived').length,
    }
  }

  // Derive from roles list — do not call /admin/metrics/roles (not implemented)
  try {
    const result = await listAdminRoles()
    const items = Array.isArray(result) ? result : result.items ?? []
    return {
      totalRoles: items.length,
      activeRoles: items.filter((r) => r.status === 'Active').length,
      archivedRoles: items.filter((r) => r.status === 'Archived').length,
      activeUsers: items.reduce((sum, r) => sum + (Number(r.usersCount) || 0), 0),
    }
  } catch {
    return {
      totalRoles: 0,
      activeRoles: 0,
      activeUsers: 0,
      archivedRoles: 0,
    }
  }
}

export async function getLeaveAdminMetrics(): Promise<LeaveAdminMetrics> {
  if (env.useMockApi) {
    await delay()
    return {
      leaveTypes: 4,
      pendingRequests: 7,
      approvedThisMonth: 23,
      avgBalanceDays: 12,
    }
  }
  // No /admin/metrics/leave on backend yet
  return {
    leaveTypes: 0,
    pendingRequests: 0,
    approvedThisMonth: 0,
    avgBalanceDays: 0,
  }
}

export async function getAttendanceAdminMetrics(): Promise<AttendanceAdminMetrics> {
  if (env.useMockApi) {
    await delay()
    return {
      presentToday: 42,
      lateToday: 3,
      onLeaveToday: 5,
      remoteCheckIns: 8,
    }
  }
  // No /admin/metrics/attendance on backend yet
  return {
    presentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
    remoteCheckIns: 0,
  }
}
