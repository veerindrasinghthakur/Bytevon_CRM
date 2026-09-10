/** Admin / org metric aggregates for hub, roles, leave, attendance. */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { adminKpis, adminRoles, offices } from '../data/mock'
import type {
  AdminHubMetrics,
  RoleListMetrics,
  LeaveAdminMetrics,
  AttendanceAdminMetrics,
} from '../types'
import { getDb, delay } from '@/shared/mock/db'
import { listAdminRoles } from './roles'

async function tryGet<T>(path: string): Promise<T | null> {
  try {
    const { data } = await apiClient.get<T>(path)
    return data
  } catch {
    return null
  }
}

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
  const data = await tryGet<AdminHubMetrics>('/admin/metrics/hub')
  if (data) return data
  // Backend may not expose hub metrics yet — zeroed safe defaults
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

  // Preferred dedicated endpoint (not implemented on all backends yet)
  const dedicated = await tryGet<RoleListMetrics>('/admin/metrics/roles')
  if (dedicated) return dedicated

  // Fallback: compute from roles list so RolesListPage never 404-spams
  try {
    const result = await listAdminRoles({ pageSize: 500 })
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
  const data = await tryGet<LeaveAdminMetrics>('/admin/metrics/leave')
  if (data) return data
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
  const data = await tryGet<AttendanceAdminMetrics>('/admin/metrics/attendance')
  if (data) return data
  return {
    presentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
    remoteCheckIns: 0,
  }
}
