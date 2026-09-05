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
import { getDb } from '@/shared/mock/db'
import { delay} from '@/shared/mock/db'


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
  const { data } = await apiClient.get<AdminHubMetrics>('/admin/metrics/hub')
  return data
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
  const { data } = await apiClient.get<RoleListMetrics>('/admin/metrics/roles')
  return data
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
  const { data } = await apiClient.get<LeaveAdminMetrics>('/admin/metrics/leave')
  return data
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
  const { data } = await apiClient.get<AttendanceAdminMetrics>('/admin/metrics/attendance')
  return data
}
