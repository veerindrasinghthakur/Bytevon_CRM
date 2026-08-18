/**
 * Employment API — schema-shaped detail + history.
 * Pages must load via this module (props), not local mock arrays.
 */

import { delay, getDb } from '@/shared/mock/db'
import type { EmployeeDetailDto, EmploymentRow } from '@/shared/schema'

export async function listEmployments(params?: { search?: string }) {
  await delay()
  const db = getDb()
  let items = db.employments.map((e) => enrichListRow(e))
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (e) =>
        e.employee_code.toLowerCase().includes(q) ||
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q),
    )
  }
  return { items, total: items.length }
}

function enrichListRow(e: EmploymentRow) {
  const db = getDb()
  const person = db.persons.find((p) => p.id === e.person_id)
  const assignment = db.employment_assignments.find(
    (a) => a.employment_id === e.id && a.effective_to == null,
  )
  const dept = assignment
    ? db.schema_departments.find((d) => d.id === assignment.department_id)
    : null
  const position = assignment ? db.positions.find((p) => p.id === assignment.position_id) : null
  const loginUser = db.users.find((u) => u.id === e.person_id)
  return {
    ...e,
    fullName: person ? `${person.first_name} ${person.last_name}` : e.employee_code,
    email: loginUser?.email ?? person?.personal_email ?? '',
    departmentName: dept?.name ?? '—',
    positionName: position?.name ?? '—',
  }
}

export async function getEmployeeDetail(employmentId: number): Promise<EmployeeDetailDto | null> {
  await delay()
  const db = getDb()
  const employment = db.employments.find((e) => e.id === employmentId)
  if (!employment) return null

  const person = db.persons.find((p) => p.id === employment.person_id)
  if (!person) return null

  const assignmentHistory = db.employment_assignments
    .filter((a) => a.employment_id === employmentId)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from))
    .map((a) => ({ ...a }))

  const currentAssignment = assignmentHistory.find((a) => a.effective_to == null) ?? null

  const department = currentAssignment
    ? db.schema_departments.find((d) => d.id === currentAssignment.department_id) ?? null
    : null
  const position = currentAssignment
    ? db.positions.find((p) => p.id === currentAssignment.position_id) ?? null
    : null
  const location = currentAssignment
    ? db.locations.find((l) => l.id === currentAssignment.location_id) ?? null
    : null
  const shift = currentAssignment
    ? db.shifts.find((s) => s.id === currentAssignment.shift_id) ?? null
    : null

  const stateHistory = db.employment_state_history
    .filter((h) => h.employment_id === employmentId)
    .sort((a, b) => b.effective_date.localeCompare(a.effective_date))
    .map((h) => ({ ...h }))

  const roleIds = db.employee_roles
    .filter((er) => er.employment_id === employmentId)
    .map((er) => er.role_id)
  const roleNames = db.roles.filter((r) => roleIds.includes(r.id)).map((r) => r.name)

  const currentSalary =
    db.employee_salary.find((s) => s.employment_id === employmentId && s.effective_to == null) ??
    null

  return {
    employment: { ...employment },
    person: { ...person },
    currentAssignment: currentAssignment ? { ...currentAssignment } : null,
    department: department ? { ...department } : null,
    position: position ? { ...position } : null,
    location: location ? { ...location } : null,
    shift: shift ? { ...shift } : null,
    stateHistory,
    assignmentHistory,
    roleIds,
    roleNames,
    currentSalary: currentSalary ? { ...currentSalary } : null,
  }
}
