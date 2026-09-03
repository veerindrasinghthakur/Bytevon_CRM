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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db.persons as any[]).push({
    id: personId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    date_of_birth: input.dateOfBirth || null,
    personal_email: input.personalEmail || null,
    personal_phone: input.personalPhone || null,
    address: input.address || null,
    is_anonymized: false,
    anonymized_at: null,
    created_at: now,
    updated_at: now,
  })

  const empId = nextId(db.employments)
  const code = `EMP-${String(empId).padStart(3, '0')}`
  const employment = {
    id: empId,
    person_id: personId,
    employee_code: code,
    employment_type: input.employmentType,
    current_state: EmploymentState.ONBOARDING,
    joining_date: input.joiningDate,
    created_at: now,
    updated_at: now,
    changed_by: 1,
  }
  // Seed arrays are literal-union typed — push via any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db.employments as any[]).push(employment)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db.employment_state_history as any[]).push({
    id: nextId(db.employment_state_history),
    employment_id: empId,
    previous_state: null,
    new_state: EmploymentState.ONBOARDING,
    effective_date: input.joiningDate,
    reason: 'Joined',
    created_at: now,
    changed_by: 1,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db.employment_assignments as any[]).push({
    id: nextId(db.employment_assignments),
    employment_id: empId,
    department_id: input.departmentId,
    position_id: input.positionId,
    location_id: input.locationId,
    shift_id: input.shiftId,
    work_mode: (input.workMode as WorkMode) || 'OFFICE',
    effective_from: input.joiningDate,
    effective_to: null,
    change_reason: 'Initial assignment',
    created_at: now,
    changed_by: 1,
  })

  const employeeRole = db.roles.find((r) => r.name === 'Employee')
  if (employeeRole) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(db.employee_roles as any[]).push({
      employment_id: empId,
      role_id: employeeRole.id,
      assigned_at: now,
      changed_by: 1,
    })
  }

  if (input.bank?.accountNumber) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(db.employee_bank_accounts as any[]).push({
      id: nextId(db.employee_bank_accounts),
      employment_id: empId,
      account_holder_name: input.bank.accountHolderName || `${input.firstName} ${input.lastName}`,
      bank_name: input.bank.bankName,
      account_number: input.bank.accountNumber,
      ifsc_code: input.bank.ifscCode,
      account_type: 'SAVINGS',
      is_primary: true,
      is_active: true,
      created_at: now,
      updated_at: now,
      changed_by: 1,
    })
  }

  return enrichListRow(employment as EmploymentRow)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emp = db.employments.find((e) => e.id === employmentId) as any
  if (!emp) throw new Error('Employment not found')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const person = db.persons.find((p) => p.id === emp.person_id) as any
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
    emp.employment_type = patch.employmentType
  }
  if (patch.currentState) {
    emp.current_state = patch.currentState
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
