/**
 * Admin users / logins API.
 * Mock: shared getDb. Real: FastAPI mock_backend /admin/users*.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { LoginUserRow } from '@/shared/schema'
import type { AdminUserListItem, EmploymentWithoutLogin } from '../types'

/** Role option for user-create picker (supports backend string ids e.g. R-01). */
export interface AdminRoleOption {
  id: string
  name: string
  description?: string | null
}

export interface DepartmentOption {
  id: number
  name: string
}

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

export async function listAdminUsers(params?: { search?: string }) {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items: AdminUserListItem[]
      total: number
      locked: number
      active: number
    }>('/admin/users', { params })
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
    }
  }

  await delay()
  const db = getDb()
  const logins = ensureLoginUsers()
  let items: AdminUserListItem[] = logins.map((login) => {
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

  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.employeeCode.toLowerCase().includes(q),
    )
  }

  return {
    items,
    total: items.length,
    locked: items.filter((u) => u.status === 'Locked').length,
    active: items.filter((u) => u.status === 'Active').length,
  }
}

export async function listEmploymentsWithoutLogin(): Promise<EmploymentWithoutLogin[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<EmploymentWithoutLogin[]>('/admin/employments-without-login')
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

/** Departments for user-detail picker. */
export async function listDepartments(): Promise<DepartmentOption[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items?: Array<{ id: number; name: string }> } | Array<{ id: number; name: string }>>(
      '/organization/departments',
    )
    const rows = Array.isArray(data) ? data : data?.items ?? []
    return rows.map((d) => ({ id: Number(d.id), name: d.name }))
  }
  await delay()
  return getDb().schema_departments.map((d) => ({ id: d.id, name: d.name }))
}

/** Roles for assign-on-create. Ids stay as strings (R-01) when backend returns them. */
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

export async function createUserLogin(input: {
  employmentId: number
  email: string
  temporaryPassword: string
  roleId: number | string
  status?: LoginUserRow['status']
}): Promise<LoginUserRow> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<LoginUserRow & { detail?: string }>('/admin/users', {
      employmentId: input.employmentId,
      email: input.email,
      temporaryPassword: input.temporaryPassword,
      roleId: input.roleId,
      status: input.status,
    })
    if (data && typeof data === 'object' && 'detail' in data && data.detail) {
      throw new Error(String(data.detail))
    }
    return data as LoginUserRow
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
    email: input.email.trim(),
    temporary_password: input.temporaryPassword,
    status: input.status ?? 'ACTIVE',
    failed_attempt_count: 0,
    locked_until: null,
    last_login_at: null,
    created_at: now,
    updated_at: now,
  }
  logins.push(row)

  const numericRole = Number(input.roleId)
  const roleIdForDb = Number.isFinite(numericRole) ? numericRole : 0
  const existingRoles = db.employee_roles.filter((er) => er.employment_id === input.employmentId)
  const hasRole = existingRoles.some((er) => er.role_id === roleIdForDb)
  if (!hasRole && roleIdForDb > 0) {
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
  },
): Promise<LoginUserRow | Record<string, unknown>> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = { ...patch }
    if (patch.temporary_password != null) body.temporaryPassword = patch.temporary_password
    if (patch.temporaryPassword != null) body.temporaryPassword = patch.temporaryPassword
    if (patch.status) {
      const map: Record<string, string> = {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
        LOCKED: 'Locked',
      }
      body.status = map[patch.status] ?? patch.status
    }
    const { data } = await apiClient.patch(`/admin/users/${loginId}`, body)
    return data as LoginUserRow
  }

  await delay(300)
  const db = getDb()
  const logins = ensureLoginUsers()
  const row = logins.find((l) => l.id === loginId)
  if (!row) throw new Error('User not found')
  const { temporaryPassword, name: _n, role: _r, department: _d, departmentId, ...rest } = patch
  Object.assign(row, rest, { updated_at: new Date().toISOString() })
  if (temporaryPassword != null) row.temporary_password = temporaryPassword

  // Update current assignment department when picker saves a departmentId
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

/** Soft deactivate — login kept; can activate again. */
export async function deactivateUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.post(`/admin/users/${loginId}/deactivate`)
      return data
    } catch {
      const { data } = await apiClient.patch(`/admin/users/${loginId}`, { status: 'Inactive' })
      return data
    }
  }
  return updateUserLogin(loginId, { status: 'INACTIVE' })
}

/** Reactivate a deactivated login. */
export async function activateUser(loginId: number) {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.post(`/admin/users/${loginId}/activate`)
      return data
    } catch {
      const { data } = await apiClient.patch(`/admin/users/${loginId}`, { status: 'Active' })
      return data
    }
  }
  return updateUserLogin(loginId, {
    status: 'ACTIVE',
    failed_attempt_count: 0,
    locked_until: null,
  })
}

/**
 * Hard archive: remove login credentials entirely.
 * Employment remains and appears under "employments without login".
 */
export async function archiveUserCredentials(loginId: number) {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.post(`/admin/users/${loginId}/archive`)
      return data
    } catch {
      const { data } = await apiClient.delete(`/admin/users/${loginId}`)
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

/** @deprecated Prefer deactivateUser / archiveUserCredentials */
export async function archiveUser(loginId: number) {
  return deactivateUser(loginId)
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
    }>(`/admin/users/${loginId}`)
    if (data?.detail) return null
    const name =
      data.name ||
      (data.person
        ? `${data.person.first_name ?? ''} ${data.person.last_name ?? ''}`.trim()
        : data.email) ||
      'User'
    return {
      login: data.login ??
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
        status: (data.status as AdminUserListItem['status']) ?? statusLabel(
          (data.login?.status as LoginUserRow['status']) ?? 'ACTIVE',
        ),
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
    const { data } = await apiClient.post(`/admin/users/${loginId}/lock`)
    return data
  }
  return updateUserLogin(loginId, { status: 'LOCKED' })
}

export async function unlockUser(loginId: number) {
  if (!env.useMockApi) {
    const { data } = await apiClient.post(`/admin/users/${loginId}/unlock`)
    return data
  }
  return updateUserLogin(loginId, {
    status: 'ACTIVE',
    failed_attempt_count: 0,
    locked_until: null,
  })
}
