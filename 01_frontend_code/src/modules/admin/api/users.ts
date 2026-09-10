/**
 * Admin users / logins API.
 * Real: FastAPI /organization/users* (organization module).
 *
 * Create body (AdminUserCreate):
 *   { employmentId: int, email: EmailStr, temporaryPassword: str (min 8),
 *     roleId?: int|str, status?: str }
 *
 * 409 Conflict from backend:
 *   - "This employee already has a login account"
 *   - "Email is already in use"
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
import axios from 'axios'

const USERS_API = '/organization/users'
const EMPLOYMENTS_WITHOUT_LOGIN_API = '/organization/employments-without-login'

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
  if (!db.login_users) {
    db.login_users = []
  }
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

/** Extract FastAPI / AppException message from axios error. */
export function extractApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { detail?: string | Array<{ msg?: string }>; message?: string }
      | string
      | undefined
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
      if (Array.isArray(data.detail) && data.detail[0]?.msg) return String(data.detail[0].msg)
      if (typeof data.message === 'string' && data.message.trim()) return data.message
    }
    if (err.response?.status === 409) return 'Conflict — email or employee login already exists'
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function mapLoginUsers(): AdminUserListItem[] {
  const db = getDb()
  const logins = ensureLoginUsers()
  return logins.map((login) => {
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
  })
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
    return {
      ...page,
      locked: lockedAll,
      active: activeAll,
      departments,
      roles,
    }
  }

  return {
    items,
    total: items.length,
    locked: lockedAll,
    active: activeAll,
    departments,
    roles,
  }
}

export async function listEmploymentsWithoutLogin(): Promise<EmploymentWithoutLogin[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<EmploymentWithoutLogin[]>(EMPLOYMENTS_WITHOUT_LOGIN_API)
    return Array.isArray(data)
      ? data.map((e) => ({
          ...e,
          employmentId: Number(e.employmentId),
        }))
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
    >('/organization/departments')
    const rows = Array.isArray(data) ? data : data?.items ?? []
    return rows.map((d) => ({ id: Number(d.id), name: d.name }))
  }
  await delay()
  return getDb().schema_departments.map((d) => ({ id: d.id, name: d.name }))
}

export async function listRoles(): Promise<AdminRoleOption[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      Array<{ id: string | number; name: string; description?: string | null }>
    >('/rbac/roles')
    const rows = Array.isArray(data) ? data : []
    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      description: r.description ?? null,
    }))
  }
  await delay()
  try {
    const { adminRoles } = await import('../data/mock')
    if (adminRoles?.length) {
      return adminRoles.map((r) => ({
        id: String(r.id),
        name: r.name,
        description: r.description ?? null,
      }))
    }
  } catch {
    /* use schema */
  }
  return getDb().roles.map((r) => ({
    id: String(r.id),
    name: r.name,
    description: r.description ?? null,
  }))
}

/**
 * POST /organization/users — AdminUserCreate shape only.
 * Throws Error with backend detail on 409/4xx so the form can show it.
 */
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
    if (input.status) {
      body.status = String(input.status).toUpperCase()
    }

    try {
      const { data } = await apiClient.post<Record<string, unknown>>(USERS_API, body)
      return data
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not create user login'))
    }
  }

  await delay(400)
  const db = getDb()
  const logins = ensureLoginUsers()

  const emp = db.employments.find((e) => e.id === input.employmentId)
  if (!emp) throw new Error('Employment not found')

  if (logins.some((l) => l.employment_id === input.employmentId)) {
    throw new Error('This employee already has a login account')
  }
  if (logins.some((l) => l.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error('Email is already in use')
  }

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

  const numericRole = Number(input.roleId)
  const roleIdForDb = Number.isFinite(numericRole) ? numericRole : null
  const existingRoles = db.employee_roles.filter((er) => er.employment_id === input.employmentId)
  const hasRole = existingRoles.some((er) => er.role_id === roleIdForDb)
  if (!hasRole && roleIdForDb !== null) {
    db.employee_roles.push({
      employment_id: input.employmentId,
      role_id: roleIdForDb,
      assigned_at: now,
      changed_by: 1,
    })
  }

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
    temporaryPassword?: string
    name?: string
    role?: string
    department?: string
    departmentId?: number
    roleId?: number | string
  },
): Promise<LoginUserRow | Record<string, unknown>> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.email != null) body.email = String(patch.email).trim().toLowerCase()
    if (patch.temporary_password != null) body.temporaryPassword = patch.temporary_password
    if (patch.temporaryPassword != null) body.temporaryPassword = patch.temporaryPassword
    if (patch.departmentId != null) body.departmentId = patch.departmentId
    if (patch.roleId != null) body.roleId = patch.roleId
    if (patch.status) {
      const map: Record<string, string> = {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
        LOCKED: 'Locked',
        Active: 'Active',
        Inactive: 'Inactive',
        Locked: 'Locked',
      }
      body.status = map[patch.status] ?? patch.status
    }
    try {
      const { data } = await apiClient.patch(`${USERS_API}/${loginId}`, body)
      return data as LoginUserRow
    } catch (err) {
      throw new Error(extractApiErrorMessage(err, 'Could not update user'))
    }
  }

  await delay(300)
  const db = getDb()
  const logins = ensureLoginUsers()
  const row = logins.find((l) => l.id === loginId)
  if (!row) throw new Error('User not found')
  const { temporaryPassword, name: _n, role: _r, department: _d, departmentId, roleId: _rid, ...rest } =
    patch
  Object.assign(row, rest, { updated_at: new Date().toISOString() })
  if (temporaryPassword != null) row.temporary_password = temporaryPassword

  if (departmentId != null && Number.isFinite(departmentId)) {
    const assignment = db.employment_assignments.find(
      (a) => a.employment_id === row.employment_id && a.effective_to == null,
    )
    if (assignment) {
      assignment.department_id = departmentId
    }
  }

  return { ...row }
}

export async function deactivateUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.post(`${USERS_API}/${loginId}/deactivate`)
      return data
    } catch {
      const { data } = await apiClient.patch(`${USERS_API}/${loginId}`, { status: 'Inactive' })
      return data
    }
  }
  return updateUserLogin(loginId, { status: 'INACTIVE' })
}

export async function activateUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.post(`${USERS_API}/${loginId}/activate`)
      return data
    } catch {
      const { data } = await apiClient.patch(`${USERS_API}/${loginId}`, { status: 'Active' })
      return data
    }
  }
  return updateUserLogin(loginId, {
    status: 'ACTIVE',
    failed_attempt_count: 0,
    locked_until: null,
  })
}

export async function archiveUserCredentials(loginId: number) {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.post(`${USERS_API}/${loginId}/archive`)
      return data
    } catch {
      const { data } = await apiClient.delete(`${USERS_API}/${loginId}`)
      return data
    }
  }
  await delay(300)
  const logins = ensureLoginUsers()
  const idx = logins.findIndex((l) => l.id === loginId)
  if (idx < 0) throw new Error('User not found')
  const [removed] = logins.splice(idx, 1)
  return { ok: true, employmentId: removed.employment_id }
}

export async function getUserLogin(loginId: number) {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      id: number
      detail?: string
      login?: LoginUserRow
      employment?: { id?: number; employee_code?: string } | null
      person?: { first_name?: string; last_name?: string } | null
      roleIds?: Array<number | string>
      roleNames?: string[]
      email?: string
      name?: string
      status?: string
      department?: string
      departmentId?: number
      role?: string
      lastLogin?: string
      initials?: string
      employeeCode?: string
      employmentId?: number
    }>(`${USERS_API}/${loginId}`)
    if (data?.detail) return null
    const name =
      data.name ||
      (data.person
        ? `${data.person.first_name ?? ''} ${data.person.last_name ?? ''}`.trim()
        : data.email) ||
      'User'
    return {
      login:
        data.login ??
        ({
          id: data.id,
          email: data.email ?? '',
          employment_id: data.employmentId ?? data.employment?.id ?? 0,
          status:
            data.status === 'Locked'
              ? 'LOCKED'
              : data.status === 'Inactive'
                ? 'INACTIVE'
                : 'ACTIVE',
          temporary_password: null,
          failed_attempt_count: 0,
          locked_until: null,
          last_login_at: null,
          created_at: '',
          updated_at: '',
        } as LoginUserRow),
      employment: data.employment ?? null,
      person: data.person ?? null,
      roleIds: (data.roleIds ?? []).map((x) => String(x)),
      roleNames: data.roleNames ?? (data.role ? [data.role] : []),
      display: {
        id: data.id,
        name,
        email: data.email ?? data.login?.email ?? '',
        status:
          (data.status as AdminUserListItem['status']) ??
          statusLabel((data.login?.status as LoginUserRow['status']) ?? 'ACTIVE'),
        department: data.department ?? '—',
        departmentId: data.departmentId ?? null,
        role: data.role ?? data.roleNames?.[0] ?? '—',
        lastLogin: data.lastLogin ?? 'Never',
        initials: data.initials || initials(name),
        employeeCode: data.employeeCode ?? data.employment?.employee_code ?? '—',
      },
    }
  }

  await delay()
  const db = getDb()
  const login = ensureLoginUsers().find((l) => l.id === loginId)
  if (!login) return null
  const emp = db.employments.find((e) => e.id === login.employment_id)
  const person = emp ? db.persons.find((p) => p.id === emp.person_id) : null
  const roleIds = emp
    ? db.employee_roles.filter((er) => er.employment_id === emp.id).map((er) => er.role_id)
    : []
  const roleNames = db.roles.filter((r) => roleIds.includes(r.id)).map((r) => r.name)
  const name = person ? `${person.first_name} ${person.last_name}` : login.email
  const assignment = emp
    ? db.employment_assignments.find((a) => a.employment_id === emp.id && a.effective_to == null)
    : null
  const dept = assignment
    ? db.schema_departments.find((d) => d.id === assignment.department_id)
    : null
  return {
    login: { ...login },
    employment: emp ? { ...emp } : null,
    person: person ? { ...person } : null,
    roleIds: roleIds.map(String),
    roleNames,
    display: {
      id: login.id,
      name,
      email: login.email,
      status: statusLabel(login.status),
      department: dept?.name ?? '—',
      departmentId: assignment?.department_id ?? null,
      role: roleNames[0] ?? '—',
      lastLogin: login.last_login_at
        ? new Date(login.last_login_at).toLocaleString('en-IN')
        : 'Never',
      initials: initials(name),
      employeeCode: emp?.employee_code ?? '—',
    },
  }
}

export async function lockUser(loginId: number) {
  if (!env.useMockApi) {
    const { data } = await apiClient.post(`${USERS_API}/${loginId}/lock`)
    return data
  }
  return updateUserLogin(loginId, { status: 'LOCKED' })
}

export async function unlockUser(loginId: number) {
  if (!env.useMockApi) {
    const { data } = await apiClient.post(`${USERS_API}/${loginId}/unlock`)
    return data
  }
  return updateUserLogin(loginId, {
    status: 'ACTIVE',
    failed_attempt_count: 0,
    locked_until: null,
  })
}
