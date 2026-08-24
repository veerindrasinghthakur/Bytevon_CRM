/**
 * Admin users / logins API.
 * Mock: local getDb. Real: FastAPI mock_backend /admin/users*.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { LoginUserRow, RoleRow } from '@/shared/schema'
import type { AdminUserListItem, EmploymentWithoutLogin } from '../types'

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
    return data
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
    return data
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

export async function listRoles(): Promise<RoleRow[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<Array<{ id: string | number; name: string; description?: string }>>(
      '/rbac/roles',
    )
    // Normalize to RoleRow-like (id may be string R-01 from mock backend)
    return data.map((r, i) => ({
      id: typeof r.id === 'number' ? r.id : i + 1,
      name: r.name,
      description: r.description ?? null,
      is_system: false,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // keep original id for API create payload
      ...( { _sourceId: r.id } as object),
    })) as RoleRow[]
  }
  await delay()
  return getDb().roles.map((r) => ({ ...r }))
}

export async function createUserLogin(input: {
  employmentId: number
  email: string
  temporaryPassword: string
  roleId: number | string
  status?: LoginUserRow['status']
}): Promise<LoginUserRow> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<LoginUserRow>('/admin/users', {
      employmentId: input.employmentId,
      email: input.email,
      temporaryPassword: input.temporaryPassword,
      roleId: input.roleId,
      status: input.status,
    })
    if ((data as { detail?: string }).detail) {
      throw new Error((data as { detail: string }).detail)
    }
    return data
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

  const existingRoles = db.employee_roles.filter((er) => er.employment_id === input.employmentId)
  const hasRole = existingRoles.some((er) => er.role_id === Number(input.roleId))
  if (!hasRole) {
    db.employee_roles.push({
      employment_id: input.employmentId,
      role_id: Number(input.roleId),
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
  > & { temporaryPassword?: string },
): Promise<LoginUserRow> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = { ...patch }
    if (patch.temporary_password != null) body.temporaryPassword = patch.temporary_password
    if (patch.status) {
      const map: Record<string, string> = {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
        LOCKED: 'Locked',
      }
      body.status = map[patch.status] ?? patch.status
    }
    const { data } = await apiClient.patch<LoginUserRow>(`/admin/users/${loginId}`, body)
    return data
  }

  await delay(300)
  const logins = ensureLoginUsers()
  const row = logins.find((l) => l.id === loginId)
  if (!row) throw new Error('User not found')
  Object.assign(row, patch, { updated_at: new Date().toISOString() })
  return { ...row }
}

export async function getUserLogin(loginId: number) {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      id: number
      login?: LoginUserRow
      employment?: unknown
      person?: unknown
      roleIds?: Array<number | string>
      roleNames?: string[]
      email?: string
      name?: string
    }>(`/admin/users/${loginId}`)
    if ((data as { detail?: string }).detail) return null
    return {
      login: data.login ?? ({
        id: data.id,
        email: data.email,
        employment_id: (data as { employmentId?: number }).employmentId,
      } as LoginUserRow),
      employment: data.employment ?? null,
      person: data.person ?? null,
      roleIds: (data.roleIds ?? []).map((x) => Number(x)),
      roleNames: data.roleNames ?? [],
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
  return {
    login: { ...login },
    employment: emp ? { ...emp } : null,
    person: person ? { ...person } : null,
    roleIds,
    roleNames: db.roles.filter((r) => roleIds.includes(r.id)).map((r) => r.name),
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
  return updateUserLogin(loginId, { status: 'ACTIVE', failed_attempt_count: 0, locked_until: null })
}
