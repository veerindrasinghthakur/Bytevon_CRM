/**
 * Department API — schema_departments in mock DB.
 * env.useMockApi → local mock; false → /workforce/departments
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems, type EntityListParams } from '@/shared/lib/list-params'
import type { DepartmentRow } from '@/shared/schema'
import { WorkMode } from '@/shared/schema'
import type { DepartmentListItem, DepartmentEmployee } from '../types'

export type { DepartmentListItem, DepartmentEmployee }

function staffCountFor(departmentId: number): number {
  const db = getDb()
  const activeEmpIds = new Set(
    db.employment_assignments
      .filter((a) => a.department_id === departmentId && a.effective_to == null)
      .map((a) => a.employment_id),
  )
  return activeEmpIds.size
}

function headName(employmentId: number | null): string {
  if (employmentId == null) return '—'
  const db = getDb()
  const emp = db.employments.find((e) => e.id === employmentId)
  if (!emp) return '—'
  const person = db.persons.find((p) => p.id === emp.person_id)
  return person ? `${person.first_name} ${person.last_name}` : emp.employee_code
}

function toListItem(d: DepartmentRow): DepartmentListItem {
  return {
    id: d.id,
    name: d.name,
    code: `DEPT-${String(d.id).padStart(3, '0')}`,
    headName: headName(d.department_head_employment_id),
    headEmploymentId: d.department_head_employment_id,
    staffCount: staffCountFor(d.id),
    isArchived: d.is_archived,
    status: d.is_archived ? 'Inactive' : 'Active',
    createdAt: d.created_at,
  }
}

function buildDeptMetrics(rows: DepartmentListItem[]) {
  return {
    total: rows.length,
    active: rows.filter((d) => d.status === 'Active').length,
    inactive: rows.filter((d) => d.status === 'Inactive').length,
    staffing: rows.reduce((s, d) => s + d.staffCount, 0),
  }
}

export async function listDepartments(
  params: { includeArchived?: boolean } & EntityListParams = {},
) {
  const { page = 1, pageSize = 20, search, status } = params

  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items: DepartmentListItem[]
      total: number
      metrics?: ReturnType<typeof buildDeptMetrics>
    }>('/workforce/departments', { params: { page, pageSize, search, status } })
    return {
      items: data.items,
      total: data.total,
      metrics: data.metrics ?? buildDeptMetrics(data.items),
    }
  }

  await delay()
  let rows = getDb().schema_departments.map((d) => toListItem(d))
  if (search) {
    const q = String(search).toLowerCase()
    rows = rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.headName.toLowerCase().includes(q),
    )
  }
  if (status && status !== 'All') {
    rows = rows.filter((d) => d.status === status)
  }
  if (!params.includeArchived) {
    rows = rows.filter((d) => !d.isArchived)
  }
  const metrics = buildDeptMetrics(rows)
  if (page != null || pageSize != null) {
    return { ...paginateItems(rows, Number(page) || 1, Number(pageSize) || 20), metrics }
  }
  return { items: rows, total: rows.length, metrics }
}

export async function getDepartment(id: number) {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<DepartmentListItem>(`/workforce/departments/${id}`)
      return data
    } catch {
      return null
    }
  }
  await delay()
  const row = getDb().schema_departments.find((d) => d.id === id)
  if (!row) return null
  return toListItem(row)
}

export async function listDepartmentEmployees(departmentId: number): Promise<DepartmentEmployee[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<DepartmentEmployee[] | { items: DepartmentEmployee[] }>(
      `/workforce/departments/${departmentId}/employees`,
    )
    return Array.isArray(data) ? data : (data.items ?? [])
  }
  await delay()
  const db = getDb()
  const empIds = db.employment_assignments
    .filter((a) => a.department_id === departmentId && a.effective_to == null)
    .map((a) => a.employment_id)

  const logins =
    (db as typeof db & { login_users?: { employment_id: number; email: string }[] }).login_users ??
    []

  return empIds.map((eid) => {
    const emp = db.employments.find((e) => e.id === eid)!
    const person = db.persons.find((p) => p.id === emp.person_id)
    const assignment = db.employment_assignments.find(
      (a) => a.employment_id === eid && a.effective_to == null,
    )
    const position = assignment
      ? db.positions.find((p) => p.id === assignment.position_id)
      : null
    const login = logins.find((l) => l.employment_id === eid)
    return {
      employmentId: eid,
      employeeCode: emp.employee_code,
      name: person ? `${person.first_name} ${person.last_name}` : emp.employee_code,
      positionName: position?.name ?? '—',
      state: emp.current_state,
      email: login?.email ?? person?.personal_email ?? '',
    }
  })
}

/** Employees not currently assigned to this department (for Add existing). */
export async function listEmployeesNotInDepartment(departmentId: number) {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ value: string; label: string; meta?: string }[]>(
      `/workforce/departments/${departmentId}/employees-available`,
    )
    return data
  }
  await delay(150)
  const db = getDb()
  const inDept = new Set(
    db.employment_assignments
      .filter((a) => a.department_id === departmentId && a.effective_to == null)
      .map((a) => a.employment_id),
  )
  return db.employments
    .filter((e) => !inDept.has(e.id))
    .map((e) => {
      const person = db.persons.find((p) => p.id === e.person_id)
      const name = person ? `${person.first_name} ${person.last_name}` : e.employee_code
      const assignment = db.employment_assignments.find(
        (a) => a.employment_id === e.id && a.effective_to == null,
      )
      const dept = assignment
        ? db.schema_departments.find((d) => d.id === assignment.department_id)
        : null
      return {
        value: String(e.id),
        label: `${name} (${e.employee_code})`,
        meta: dept?.name ?? e.current_state,
      }
    })
}

/** Assign existing employee into department (closes prior assignment version). */
export async function assignEmployeeToDepartment(
  employmentId: number,
  departmentId: number,
) {
  if (!env.useMockApi) {
    await apiClient.post(`/workforce/departments/${departmentId}/assign`, { employmentId })
    return { ok: true as const }
  }
  await delay(350)
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()
  const current = db.employment_assignments.find(
    (a) => a.employment_id === employmentId && a.effective_to == null,
  )
  if (current) {
    if (current.department_id === departmentId) return { ok: true as const }
    current.effective_to = today
  }
  db.employment_assignments.push({
    id: nextId(db.employment_assignments),
    employment_id: employmentId,
    department_id: departmentId,
    position_id: current?.position_id ?? 5,
    location_id: current?.location_id ?? 1,
    shift_id: current?.shift_id ?? 1,
    work_mode: current?.work_mode ?? WorkMode.OFFICE,
    effective_from: today,
    effective_to: null,
    change_reason: 'Assigned to department',
    created_at: now,
    changed_by: 1,
  })
  return { ok: true as const }
}

/** Close active assignment for employee in this department (remove from dept). */
export async function removeEmployeeFromDepartment(
  employmentId: number,
  departmentId: number,
) {
  if (!env.useMockApi) {
    await apiClient.post(`/workforce/departments/${departmentId}/remove`, { employmentId })
    return { ok: true as const }
  }
  await delay(300)
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)
  const current = db.employment_assignments.find(
    (a) =>
      a.employment_id === employmentId &&
      a.department_id === departmentId &&
      a.effective_to == null,
  )
  if (!current) return { ok: true as const }
  current.effective_to = today
  current.change_reason = 'Removed from department'

  const dept = db.schema_departments.find((d) => d.id === departmentId)
  if (dept && dept.department_head_employment_id === employmentId) {
    dept.department_head_employment_id = null
  }
  return { ok: true as const }
}

export async function createDepartment(input: {
  name: string
  headEmploymentId?: number | null
  isArchived?: boolean
}) {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<DepartmentListItem>('/workforce/departments', input)
    return data
  }
  await delay(400)
  const db = getDb()
  const now = new Date().toISOString()
  const row: DepartmentRow = {
    id: nextId(db.schema_departments),
    name: input.name.trim(),
    department_head_employment_id: input.headEmploymentId ?? null,
    is_archived: input.isArchived ?? false,
    created_at: now,
    created_by: 1,
  }
  db.schema_departments.push(row)
  return toListItem(row)
}

export async function updateDepartment(
  id: number,
  patch: Partial<{ name: string; headEmploymentId: number | null; isArchived: boolean }>,
) {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<DepartmentListItem>(`/workforce/departments/${id}`, patch)
    return data
  }
  await delay(300)
  const row = getDb().schema_departments.find((d) => d.id === id)
  if (!row) throw new Error('Department not found')
  if (patch.name != null) row.name = patch.name.trim()
  if (patch.headEmploymentId !== undefined) row.department_head_employment_id = patch.headEmploymentId
  if (patch.isArchived != null) row.is_archived = patch.isArchived
  return toListItem(row)
}

export async function listEmploymentOptionsForPicker() {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ value: string; label: string; meta?: string }[]>(
      '/workforce/employment-options',
    )
    return data
  }
  await delay(150)
  const db = getDb()
  return db.employments.map((e) => {
    const person = db.persons.find((p) => p.id === e.person_id)
    const name = person ? `${person.first_name} ${person.last_name}` : e.employee_code
    return {
      value: String(e.id),
      label: `${name} (${e.employee_code})`,
      meta: e.current_state,
    }
  })
}

/** Employees on a given shift (from active assignments). */
export async function listEmployeesOnShift(shiftId: number) {
  if (!env.useMockApi) {
    const { data } = await apiClient.get(
      `/workforce/shifts/${shiftId}/employees`,
    )
    return data as {
      employmentId: number
      employeeCode: string
      name: string
      departmentName: string
      positionName: string
      state: string
    }[]
  }
  await delay()
  const db = getDb()
  const empIds = db.employment_assignments
    .filter((a) => a.shift_id === shiftId && a.effective_to == null)
    .map((a) => a.employment_id)
  return empIds.map((eid) => {
    const emp = db.employments.find((e) => e.id === eid)!
    const person = db.persons.find((p) => p.id === emp.person_id)
    const assignment = db.employment_assignments.find(
      (a) => a.employment_id === eid && a.effective_to == null,
    )
    const dept = assignment
      ? db.schema_departments.find((d) => d.id === assignment.department_id)
      : null
    const position = assignment
      ? db.positions.find((p) => p.id === assignment.position_id)
      : null
    return {
      employmentId: eid,
      employeeCode: emp.employee_code,
      name: person ? `${person.first_name} ${person.last_name}` : emp.employee_code,
      departmentName: dept?.name ?? '—',
      positionName: position?.name ?? '—',
      state: emp.current_state,
    }
  })
}
