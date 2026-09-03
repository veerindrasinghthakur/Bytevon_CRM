/**
 * Employment API — schema-shaped list/detail + create/update.
 * env.useMockApi → local mock DB; false → /workforce/employments
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { createEmploymentMockRecords } from '@/shared/mock/schema-seed'
import { paginateItems, type EntityListParams } from '@/shared/lib/list-params'
import type {
  EmployeeDetailDto,
  EmploymentRow,
  EmploymentType,
  LoginUserRow,
} from '@/shared/schema'
import { EmploymentState } from '@/shared/schema'
import type { CreateEmploymentSchemaInput } from '../schemas/employment'

function ensureLoginUsers(): LoginUserRow[] {
  const db = getDb() as ReturnType<typeof getDb> & { login_users?: LoginUserRow[] }
  if (!db.login_users) db.login_users = []
  return db.login_users
}

export type EmploymentListItem = ReturnType<typeof enrichListRow>

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
  const location = assignment ? db.locations.find((l) => l.id === assignment.location_id) : null
  const login = ensureLoginUsers().find((u) => u.employment_id === e.id)
  const fullName = person ? `${person.first_name} ${person.last_name}` : e.employee_code
  return {
    ...e,
    fullName,
    firstName: person?.first_name ?? '',
    lastName: person?.last_name ?? '',
    email: login?.email ?? person?.personal_email ?? '',
    phone: person?.personal_phone ?? '',
    departmentName: dept?.name ?? '—',
    departmentId: assignment?.department_id ?? null,
    positionName: position?.name ?? '—',
    locationName: location?.name ?? '—',
    hasLogin: Boolean(login),
    avatarInitials: fullName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
}

function buildMetrics(items: EmploymentListItem[]) {
  return {
    total: items.length,
    active: items.filter((e) =>
      ['CONFIRMED', 'PROBATION', 'ONBOARDING'].includes(e.current_state),
    ).length,
    archived: items.filter((e) =>
      ['RESIGNED', 'TERMINATED', 'ALUMNI'].includes(e.current_state),
    ).length,
  }
}

export async function listEmployments(
  params: {
    status?: string
    department?: string
    state?: string
    type?: string
  } & EntityListParams = {},
) {
  const { page = 1, pageSize = 20, search, status, department, state, type } = params
  const stateFilter = state ?? status

  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items: EmploymentListItem[]
      total: number
      metrics?: ReturnType<typeof buildMetrics>
    }>('/workforce/employments', {
      params: { page, pageSize, search, status: stateFilter, department, type },
    })
    return { items: data.items, total: data.total, metrics: data.metrics }
  }

  await delay()
  let items = getDb().employments.map((e) => enrichListRow(e))
  if (search) {
    const q = String(search).toLowerCase()
    items = items.filter(
      (e) =>
        e.employee_code.toLowerCase().includes(q) ||
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q) ||
        e.positionName.toLowerCase().includes(q),
    )
  }
  if (stateFilter) {
    items = items.filter((e) => e.current_state === stateFilter)
  }
  if (type) {
    items = items.filter((e) => e.employment_type === type)
  }
  if (department) {
    const deptId = Number(department)
    if (Number.isFinite(deptId)) {
      items = items.filter((e) => e.departmentId === deptId)
    } else {
      const q = department.toLowerCase()
      items = items.filter((e) => e.departmentName.toLowerCase().includes(q))
    }
  }
  const metrics = buildMetrics(items)
  if (page != null || pageSize != null) {
    const pageResult = paginateItems(items, Number(page) || 1, Number(pageSize) || 20)
    return { ...pageResult, metrics }
  }
  return { items, total: items.length, metrics }
}

export async function getEmployeeDetail(employmentId: number): Promise<EmployeeDetailDto | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<EmployeeDetailDto>(
        `/workforce/employments/${employmentId}`,
      )
      return data
    } catch {
      return null
    }
  }

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

  const login = ensureLoginUsers().find((u) => u.employment_id === employmentId)

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
    hasLogin: Boolean(login),
    loginEmail: login?.email ?? null,
  }
}

export async function createEmployment(input: CreateEmploymentSchemaInput) {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<EmploymentListItem>('/workforce/employments', input)
    return data
  }

  await delay(500)
  const db = getDb()
  const now = new Date().toISOString()

  const personId = nextId(db.persons)
  const empId = nextId(db.employments)
  const employeeRole = db.roles.find((r) => r.name === 'Employee')
  const records = createEmploymentMockRecords(input, {
    personId,
    employmentId: empId,
    stateHistoryId: nextId(db.employment_state_history),
    assignmentId: nextId(db.employment_assignments),
    bankAccountId: nextId(db.employee_bank_accounts),
    employeeRoleId: employeeRole?.id,
  }, now)

  ;(db.persons as unknown as Record<string, unknown>[]).push(records.person)
  const employment = records.employment as EmploymentRow
  // Seed arrays are literal-union typed — push via widened array
  ;(db.employments as EmploymentRow[]).push(employment)

  ;(db.employment_state_history as unknown as Record<string, unknown>[]).push(records.stateHistory)
  ;(db.employment_assignments as unknown as Record<string, unknown>[]).push(records.assignment)
  if (records.employeeRole) {
    ;(db.employee_roles as unknown as Record<string, unknown>[]).push(records.employeeRole)
  }
  if (records.bankAccount) {
    ;(db.employee_bank_accounts as unknown as Record<string, unknown>[]).push(records.bankAccount)
  }

  return enrichListRow(employment)
}

export async function updateEmployment(
  employmentId: number,
  patch: {
    firstName?: string
    lastName?: string
    personalEmail?: string | null
    personalPhone?: string | null
    address?: string | null
    dateOfBirth?: string | null
    employmentType?: EmploymentType | string
    currentState?: string
  },
) {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<EmploymentListItem>(
      `/workforce/employments/${employmentId}`,
      patch,
    )
    return data
  }

  await delay(400)
  const db = getDb()
  const emp = db.employments.find((e) => e.id === employmentId) as
    | {
        person_id: number
        employment_type: EmploymentRow['employment_type']
        current_state: EmploymentRow['current_state']
        updated_at: string
      }
    | undefined
  if (!emp) throw new Error('Employment not found')
  const person = db.persons.find((p) => p.id === emp.person_id) as
    | {
        first_name: string
        last_name: string
        personal_email: string | null
        personal_phone: string | null
        address: string | null
        date_of_birth: string | null
        updated_at: string
      }
    | undefined
  if (!person) throw new Error('Person not found')
  const now = new Date().toISOString()

  if (patch.firstName != null) person.first_name = patch.firstName
  if (patch.lastName != null) person.last_name = patch.lastName
  if (patch.personalEmail !== undefined) person.personal_email = patch.personalEmail
  if (patch.personalPhone !== undefined) person.personal_phone = patch.personalPhone
  if (patch.address !== undefined) person.address = patch.address
  if (patch.dateOfBirth !== undefined) person.date_of_birth = patch.dateOfBirth
  person.updated_at = now

  if (patch.employmentType) {
    emp.employment_type = patch.employmentType as EmploymentRow['employment_type']
  }
  if (patch.currentState) {
    emp.current_state = patch.currentState as EmploymentRow['current_state']
  }
  emp.updated_at = now

  return enrichListRow(emp as EmploymentRow)
}

export async function getOrgMastersForEmployeeForm() {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      departments: { id: number; name: string }[]
      positions: { id: number; name: string }[]
      locations: { id: number; name: string }[]
      shifts: { id: number; name: string }[]
    }>('/workforce/org-masters')
    return data
  }
  await delay(200)
  const db = getDb()
  return {
    departments: db.schema_departments.filter((d) => !d.is_archived).map((d) => ({ ...d })),
    positions: db.positions.filter((p) => !p.is_archived).map((p) => ({ ...p })),
    locations: db.locations.filter((l) => !l.is_archived).map((l) => ({ ...l })),
    shifts: db.shifts.filter((s) => !s.is_archived).map((s) => ({ ...s })),
  }
}
