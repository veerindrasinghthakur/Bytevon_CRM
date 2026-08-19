/**
 * Department API — schema_departments in mock DB.
 */

import { delay, getDb, nextId } from '@/shared/mock/db'
import type { DepartmentRow } from '@/shared/schema'

export interface DepartmentListItem {
  id: number
  name: string
  code: string
  headName: string
  headEmploymentId: number | null
  staffCount: number
  isArchived: boolean
  status: 'Active' | 'Inactive'
  createdAt: string
}

export interface DepartmentEmployee {
  employmentId: number
  employeeCode: string
  name: string
  positionName: string
  state: string
  email: string
}

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

export async function listDepartments(params?: { search?: string; includeArchived?: boolean }) {
  await delay()
  let rows = getDb().schema_departments.map((d) => toListItem(d))
  if (!params?.includeArchived) rows = rows.filter((d) => !d.isArchived)
  if (params?.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.headName.toLowerCase().includes(q),
    )
  }
  return { items: rows, total: rows.length }
}

export async function getDepartment(id: number) {
  await delay()
  const row = getDb().schema_departments.find((d) => d.id === id)
  if (!row) return null
  return toListItem(row)
}

export async function listDepartmentEmployees(departmentId: number): Promise<DepartmentEmployee[]> {
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

export async function createDepartment(input: {
  name: string
  headEmploymentId?: number | null
  isArchived?: boolean
}) {
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
  await delay(300)
  const row = getDb().schema_departments.find((d) => d.id === id)
  if (!row) throw new Error('Department not found')
  if (patch.name != null) row.name = patch.name.trim()
  if (patch.headEmploymentId !== undefined) row.department_head_employment_id = patch.headEmploymentId
  if (patch.isArchived != null) row.is_archived = patch.isArchived
  return toListItem(row)
}

export async function listEmploymentOptionsForPicker() {
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
