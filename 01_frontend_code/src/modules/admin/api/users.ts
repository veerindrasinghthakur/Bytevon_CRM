/**
 * Admin users / logins API.
 * Real: FastAPI /admin/users*
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type { LoginUserRow } from '@/shared/schema'
import type {
  AdminUserListItem,
  EmploymentWithoutLogin,
  AdminRoleOption,
  DepartmentOption,
  AdminUserListParams,
} from '../types'

const USERS_API = '/admin/users'
const EMPLOYMENTS_WITHOUT_LOGIN_API = '/admin/employments-without-login'

function statusLabel(s: LoginUserRow['status']): AdminUserListItem['status'] {
  if (s === 'LOCKED') return 'Locked'
  if (s === 'INACTIVE') return 'Inactive'
  return 'Active'
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ensureLoginUsers(): LoginUserRow[] {
  const db = getDb() as ReturnType<typeof getDb> & { login_users?: LoginUserRow[] }
  if (!db.login_users) db.login_users = []
  return db.login_users
}

function inDateRange(iso: string | null, from?: string, to?: string): boolean {
  if (!from && !to) return true
  if (!iso) return false
  const day = iso.slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

export function extractApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
  const detail = e?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => (typeof d === 'object' && d && 'msg' in d ? String((d as { msg: string }).msg) : String(d))).join('; ')
  if (e?.message) return e.message
  return fallback
}

function toListDisplay(login: LoginUserRow): AdminUserListItem {
  const db = getDb()
  const emp = db.employments.find((e) => e.id === login.employment_id)
  const person = emp ? db.persons.find((p) => p.id === emp.person_id) : null
  const name = person ? `${person.first_name} ${person.last_name}` : login.email
  const assignment = emp
    ? db.employment_assignments.find((a) => a.employment_id === emp.id && a.effective_to == null)
    : null
  const dept = assignment
    ? db.schema_departments.find((d) => d.id === assignment.department_id)
    : null
  const roleIds = emp
    ? db.employee_roles.filter((er) => er.employment_id === emp.id).map((er) => er.role_id)
    : []
  const roleNames = db.roles.filter((r) => roleIds.includes(r.id)).map((r) => r.name)
  return {
    id: login.id,
    employmentId: login.employment_id,
    name,
    email: login.email,
    role: roleNames[0] ?? '—',
    department: dept?.name ?? '—',
    status: statusLabel(login.status),
    lastLogin: login.last_login_at
      ? new Date(login.last_login_at).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Never',
    lastLoginAt: login.last_login_at ?? null,
    initials: initials(name),
    employeeCode: emp?.employee_code ?? '—',
  }
}

function mapLoginUsers(): AdminUserListItem[] {
  return ensureLoginUsers().map(toListDisplay)
}

export async function listAdminUsers(params?: AdminUserListParams) {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items: AdminUserListItem[]
      total: number
      locked: number
      active: number
      departments?: string[]
      roles?: string[]
    }>(USERS_API, { params })
    return {
      items: (data.items ?? []).map((u) => ({
        ...u,
        id: Number(u.id),
        employmentId: Number(u.employmentId ?? 0),
        lastLoginAt: u.lastLoginAt ?? null,
        employeeCode: u.employeeCode ?? '—',
        initials: u.initials || initials(u.name || u.email || 'U'),
      })),
      total: data.total ?? data.items?.length ?? 0,
      locked: data.locked ?? 0,
      active: data.active ?? 0,
      departments: data.departments ?? [],
      roles: data.roles ?? [],
    }
  }

  await delay()
  const all = mapLoginUsers()
  const departments = Array.from(
    new Set(all.map((u) => u.department).filter((d) => d && d !== '—')),
  ).sort()
  const roles = Array.from(new Set(all.map((u) => u.role).filter((r) => r && r !== '—'))).sort()
  const lockedAll = all.filter((u) => u.status === 'Locked').length
  const activeAll = all.filter((u) => u.status === 'Active').length

  let items = all
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.employeeCode.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') {
    items = items.filter((u) => u.status === params.status)
  }
  if (params?.department && params.department !== 'All') {
    items = items.filter((u) => u.department === params.department)
  }
  if (params?.role && params.role !== 'All') {
    items = items.filter((u) => u.role === params.role)
  }
  if (params?.dateFrom || params?.dateTo) {
    items = items.filter((u) => inDateRange(u.lastLoginAt, params.dateFrom, params.dateTo))
  }

  if (params?.page != null || params?.pageSize != null) {
    const page = paginateItems(items, params.page, params.pageSize)
    return { ...page, locked: lockedAll, active: activeAll, departments, roles }
  }

  return { items, total: items.length, locked: lockedAll, active: activeAll, departments, roles }
}

export async function listEmploymentsWithoutLogin(): Promise<EmploymentWithoutLogin[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<EmploymentWithoutLogin[]>(EMPLOYMENTS_WITHOUT_LOGIN_API)
    return Array.isArray(data)
      ? data.map((e) => ({ ...e, employmentId: Number(e.employmentId) }))
      : []
  }
  await delay()
  const db = getDb()
  const logins = ensureLoginUsers()
  const linked = new Set(logins.map((l) => l.employment_id))
  return db.employments
    .filter((e) => !linked.has(e.id))
    .map((e) => {
      const person = db.persons.find((p) => p.id === e.person_id)
      const assignment = db.employment_assignments.find(
        (a) => a.employment_id === e.id && a.effective_to == null,
      )
      const dept = assignment
        ? db.schema_departments.find((d) => d.id === assignment.department_id)
        : null
      const position = assignment
        ? db.positions.find((p) => p.id === assignment.position_id)
        : null
      return {
        employmentId: e.id,
        employeeCode: e.employee_code,
        name: person ? `${person.first_name} ${person.last_name}` : e.employee_code,
        department: dept?.name ?? '—',
        position: position?.name ?? '—',
        joiningDate: e.joining_date,
      }
    })
}

export async function listDepartments(): Promise<DepartmentOption[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      { items?: Array<{ id: number; name: string }> } | Array<{ id: number; name: string }>
    >('/workforce/departments')
    const rows = Array.isArray(data) ? data : data?.items ?? []
    return rows.map((d) => ({ id: Number(d.id), name: d.name }))
  }
  await delay()
  return getDb().schema_departments.map((d) => ({ id: d.id, name: d.name }))
}

export async function listRoles(): Promise<AdminRoleOption[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      | Array<{ id: string | number; name: string; description?: string | null }>
      | { items?: Array<{ id: string | number; name: string; description?: string | null }> }
    >('/rbac/roles')
    const rows = Array.isArray(data) ? data : (data.items ?? [])
    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      description: r.description ?? null,
    }))
  }
  await delay()
  return getDb().roles.map((r) => ({
    id: String(r.id),
    name: r.name,
    description: r.description ?? null,
  }))
}

export async function createUserLogin(input: {
  employmentId: number
  email: string
  temporaryPassword: string
  roleId: number | string
  status?: LoginUserRow['status'] | string
}): Promise<Record<string, unknown>> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {
      employmentId: Number(input.employmentId),
      email: String(input.email).trim().toLowerCase(),
      temporaryPassword: String(input.temporaryPassword),
    }
    if (input.roleId != null && String(input.roleId).trim() !== '') {
      const n = Number(input.roleId)
      body.roleId = Number.isFinite(n) ? n : input.roleId
    }
    if (input.status) body.status = String(input.status).toUpperCase()
    try {
      const { data } = await apiClient.post<Record<string, unknown>>(USERS_API, body)
      return data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not create user login'))
    }
  }
  await delay(400)
  const logins = ensureLoginUsers()
  const db = getDb()
  if (!db.employments.find((e) => e.id === input.employmentId)) throw new Error('Employment not found')
  if (logins.some((l) => l.employment_id === input.employmentId))
    throw new Error('This employee already has a login account')
  if (logins.some((l) => l.email.toLowerCase() === input.email.toLowerCase()))
    throw new Error('Email is already in use')
  const now = new Date().toISOString()
  const row: LoginUserRow = {
    id: nextId(logins),
    employment_id: input.employmentId,
    email: input.email.trim().toLowerCase(),
    temporary_password: input.temporaryPassword,
    status: (input.status as LoginUserRow['status']) ?? 'ACTIVE',
    failed_attempt_count: 0,
    locked_until: null,
    last_login_at: null,
    created_at: now,
    updated_at: now,
  }
  logins.push(row)
  return { ...row }
}

export async function updateUserLogin(
  loginId: number,
  patch: Partial<
    Pick<
      LoginUserRow,
      'email' | 'status' | 'temporary_password' | 'locked_until' | 'failed_attempt_count'
    >
  > & {
    // Display name / department / role live on linked records; forwarded so a
    // future backend field picks them up (currently ignored server-side).
    name?: string
    department?: string
    role?: string
    temporaryPassword?: string
    departmentId?: number
    roleId?: number | string
  },
) {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.email != null) body.email = String(patch.email).trim().toLowerCase()
    if (patch.name != null) body.name = String(patch.name).trim()
    if (patch.department != null) body.department = patch.department
    if (patch.role != null) body.role = patch.role
    if (patch.temporary_password != null) body.temporaryPassword = patch.temporary_password
    if (patch.temporaryPassword != null) body.temporaryPassword = patch.temporaryPassword
    if (patch.departmentId != null) body.departmentId = patch.departmentId
    if (patch.roleId != null) body.roleId = patch.roleId
    if (patch.status) body.status = patch.status
    try {
      const { data } = await apiClient.patch(`${USERS_API}/${loginId}`, body)
      return data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not update user'))
    }
  }
  await delay(300)
  const row = ensureLoginUsers().find((l) => l.id === loginId)
  if (!row) throw new Error('User not found')
  Object.assign(row, patch, { updated_at: new Date().toISOString() })
  if (patch.temporaryPassword != null) row.temporary_password = patch.temporaryPassword
  return { ...row }
}

export async function deactivateUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      return (await apiClient.post(`${USERS_API}/${loginId}/deactivate`)).data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not deactivate user'))
    }
  }
  return updateUserLogin(loginId, { status: 'INACTIVE' })
}

export async function activateUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      return (await apiClient.post(`${USERS_API}/${loginId}/activate`)).data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not activate user'))
    }
  }
  return updateUserLogin(loginId, { status: 'ACTIVE', failed_attempt_count: 0, locked_until: null })
}

export async function deleteUserCredentials(loginId: number) {
  if (!env.useMockApi) {
    try {
      return (await apiClient.delete(`${USERS_API}/${loginId}`)).data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not delete user'))
    }
  }
  const logins = ensureLoginUsers()
  const idx = logins.findIndex((l) => l.id === loginId)
  if (idx < 0) throw new Error('User not found')
  const [removed] = logins.splice(idx, 1)
  return { ok: true, employmentId: removed.employment_id }
}

/** @deprecated Use deleteUserCredentials (DELETE verb + soft-delete). */
export async function archiveUserCredentials(loginId: number) {
  return deleteUserCredentials(loginId)
}

/** Q16: restore an archived login (real backend only). */
export async function restoreUserCredentials(loginId: number) {
  if (!env.useMockApi) {
    try {
      return (await apiClient.post(`${USERS_API}/${loginId}/restore`)).data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not restore user'))
    }
  }
  await delay(300)
  return { ok: true, loginId }
}

/** Alias kept for symmetry with the restore* naming used elsewhere. */
export const restoreUser = restoreUserCredentials

export type AdminUserDetailDisplay = AdminUserListItem & {
  departmentId?: number | null
  isArchived?: boolean
}

export type AdminUserDetail = {
  display: AdminUserDetailDisplay
  login: Record<string, unknown>
  isArchived?: boolean
}

function toDetailDisplay(
  raw: Record<string, unknown>,
  loginId: number,
  viaArchived: boolean,
): AdminUserDetailDisplay {
  const status = String(raw.status ?? 'Active') as AdminUserListItem['status']
  return {
    id: Number(raw.id ?? loginId),
    employmentId: Number(raw.employmentId ?? 0),
    name: String(raw.name ?? raw.email ?? ''),
    email: String(raw.email ?? ''),
    role: String(raw.role ?? '—'),
    department: String(raw.department ?? '—'),
    status,
    lastLogin: String(raw.lastLogin ?? 'Never'),
    lastLoginAt: (raw.lastLoginAt as string | null) ?? null,
    initials: String(raw.initials ?? 'U'),
    employeeCode: String(raw.employeeCode ?? '—'),
    departmentId: raw.departmentId != null ? Number(raw.departmentId) : null,
    isArchived: viaArchived,
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  )
}

export async function getUserLogin(loginId: number, opts?: { includeArchived?: boolean }) {
  if (!env.useMockApi) {
    const fetchOne = async (withArchived: boolean) => {
      const { data } = await apiClient.get<Record<string, unknown>>(
        `${USERS_API}/${loginId}`,
        { params: withArchived ? { include_archived: true } : undefined },
      )
      return (data ?? {}) as Record<string, unknown>
    }
    let viaArchived = opts?.includeArchived === true
    let raw: Record<string, unknown>
    try {
      raw = await fetchOne(viaArchived)
    } catch (err) {
      // Archived rows 404 by default — retry with include_archived before giving up.
      if (!viaArchived && isNotFound(err)) {
        raw = await fetchOne(true)
        viaArchived = true
      } else {
        throw err
      }
    }
    return {
      display: toDetailDisplay(raw, loginId, viaArchived),
      login: raw,
      isArchived: viaArchived,
    } as AdminUserDetail
  }
  await delay()
  const login = ensureLoginUsers().find((l) => l.id === loginId)
  if (!login) return null
  const display: AdminUserDetailDisplay = { ...toListDisplay(login), isArchived: false }
  return { login: { ...login }, display, isArchived: false } as AdminUserDetail
}

export async function lockUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      return (await apiClient.post(`${USERS_API}/${loginId}/lock`)).data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not lock user'))
    }
  }
  return updateUserLogin(loginId, { status: 'LOCKED' })
}

export async function unlockUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      return (await apiClient.post(`${USERS_API}/${loginId}/unlock`)).data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not unlock user'))
    }
  }
  return updateUserLogin(loginId, { status: 'ACTIVE', failed_attempt_count: 0, locked_until: null })
}
