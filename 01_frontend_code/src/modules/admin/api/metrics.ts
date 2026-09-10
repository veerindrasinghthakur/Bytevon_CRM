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
import { getLocations, getShifts, getSchemaDepartments } from './organization'
import { listEmployments } from '@/modules/workforce/api/employment'
import { listAdminUsers } from './users'

/**
 * Hub KPIs for Administration Settings.
 * No dedicated /admin/metrics/hub — derive from list endpoints in parallel.
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

  const empty: AdminHubMetrics = {
    users: 0,
    roles: 0,
    activeSessions: 0,
    auditEventsToday: 0,
    configHealth: 'ok',
    offices: 0,
    departments: 0,
    employees: 0,
    shifts: 0,
  }

  const [locationsRes, shiftsRes, deptsRes, employmentsRes, usersRes, rolesRes] =
    await Promise.allSettled([
      getLocations(),
      getShifts(),
      getSchemaDepartments(),
      listEmployments({ page: 1, pageSize: 500 }),
      listAdminUsers({ page: 1, pageSize: 1 }),
      listAdminRoles(),
    ])

  if (locationsRes.status === 'fulfilled') {
    empty.offices = locationsRes.value.total ?? locationsRes.value.items?.length ?? 0
  }
  if (shiftsRes.status === 'fulfilled') {
    empty.shifts = shiftsRes.value.total ?? shiftsRes.value.items?.length ?? 0
  }
  if (deptsRes.status === 'fulfilled') {
    empty.departments = deptsRes.value.total ?? deptsRes.value.items?.length ?? 0
  }
  if (employmentsRes.status === 'fulfilled') {
    const m = employmentsRes.value.metrics
    empty.employees =
      m?.active ??
      employmentsRes.value.total ??
      employmentsRes.value.items?.length ??
      0
  }
  if (usersRes.status === 'fulfilled') {
    empty.users = usersRes.value.total ?? usersRes.value.items?.length ?? 0
  }
  if (rolesRes.status === 'fulfilled') {
    const items = Array.isArray(rolesRes.value)
      ? rolesRes.value
      : rolesRes.value.items ?? []
    empty.roles = items.length
  }

  return empty
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
  return {
    presentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
    remoteCheckIns: 0,
  }
}
