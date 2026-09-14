/**
 * Employment API — schema-shaped list/detail + create/update.
 * env.useMockApi → local mock DB; false → /workforce/employments
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
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
  const activeStates: EmploymentState[] = [EmploymentState.CONFIRMED, EmploymentState.PROBATION, EmploymentState.ONBOARDING]
  const archivedStates: EmploymentState[] = [EmploymentState.RESIGNED, EmploymentState.TERMINATED, EmploymentState.ALUMNI]
  return {
    total: items.length,
    active: items.filter((e) => activeStates.includes(e.current_state as EmploymentState)).length,
    archived: items.filter((e) => archivedStates.includes(e.current_state as EmploymentState)).length,
  }
}

function mapApiEmployment(row: Record<string, unknown>): EmploymentListItem {
  const id = Number(row.id)
  const person = (row.person as Record<string, unknown> | undefined) ?? {}
  const first = String(row.firstName ?? row.first_name ?? person.first_name ?? '')
  const last = String(row.lastName ?? row.last_name ?? person.last_name ?? '')
  const code = String(row.employeeCode ?? row.employee_code ?? '')
  const fullName = `${first} ${last}`.trim() || code || `Employment ${id}`
  const currentState = String(row.currentState ?? row.current_state ?? '')
  return {
    id,
    person_id: Number(row.personId ?? row.person_id ?? 0),
    employee_code: code,
    employment_type: String(row.employmentType ?? row.employment_type ?? 'FULL_TIME') as EmploymentType,
    current_state: currentState as EmploymentState,
    joining_date: String(row.joiningDate ?? row.joining_date ?? ''),
    leaving_date: (row.leavingDate ?? row.leaving_date ?? null) as string | null,
    created_at: String(row.createdAt ?? row.created_at ?? ''),
    updated_at: String(row.updatedAt ?? row.updated_at ?? ''),
    fullName,
    firstName: first,
    lastName: last,
    email: String(row.email ?? person.personal_email ?? ''),
    phone: String(row.phone ?? person.personal_phone ?? ''),
    departmentName: String(row.departmentName ?? row.department_name ?? '—'),
    departmentId:
      row.departmentId != null || row.department_id != null
        ? Number(row.departmentId ?? row.department_id)
        : null,
    positionName: String(row.positionName ?? row.position_name ?? '—'),
    locationName: String(row.locationName ?? row.location_name ?? '—'),
    hasLogin: Boolean(row.hasLogin ?? row.has_login),
    avatarInitials: fullName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
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
    const limit = Math.min(500, Math.max(Number(pageSize) || 20, 1) * Math.max(Number(page) || 1, 1))
    const { data } = await apiClient.get<
      | Array<Record<string, unknown>>
      | {
          items?: Array<Record<string, unknown>>
          total?: number
          metrics?: ReturnType<typeof buildMetrics>
        }
    >('/workforce/employments', {
      params: {
        state: stateFilter || undefined,
        limit,
        offset: 0,
      },
    })
    const raw = Array.isArray(data) ? data : (data.items ?? [])
    let items = raw.filter(Boolean).map((row) => mapApiEmployment(row as Record<string, unknown>))
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
    const pageResult = paginateItems(items, Number(page) || 1, Number(pageSize) || 20)
    return { ...pageResult, metrics }
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

function mapApiEmployeeDetail(raw: Record<string, unknown>): EmployeeDetailDto {
  if (raw.employment && typeof raw.employment === 'object') {
    return raw as unknown as EmployeeDetailDto
  }
  const id = Number(raw.id)
  const first = String(raw.first_name ?? raw.firstName ?? '')
  const last = String(raw.last_name ?? raw.lastName ?? '')
  return {
    employment: {
      id,
      person_id: Number(raw.person_id ?? raw.personId ?? 0),
      employee_code: String(raw.employee_code ?? raw.employeeCode ?? ''),
      employment_type: String(raw.employment_type ?? raw.employmentType ?? 'FULL_TIME') as EmploymentType,
      current_state: String(raw.current_state ?? raw.currentState ?? 'CONFIRMED') as EmploymentState,
      joining_date: String(raw.joining_date ?? raw.joiningDate ?? ''),
      leaving_date: (raw.leaving_date ?? raw.leavingDate ?? null) as string | null,
      created_at: String(raw.created_at ?? raw.createdAt ?? ''),
      updated_at: String(raw.updated_at ?? raw.updatedAt ?? ''),
    },
    person: {
      id: Number(raw.person_id ?? raw.personId ?? 0),
      first_name: first,
      last_name: last,
      personal_email: (raw.personal_email ?? raw.personalEmail ?? raw.email ?? null) as string | null,
      personal_phone: (raw.personal_phone ?? raw.personalPhone ?? raw.phone ?? null) as string | null,
      address: (raw.address ?? null) as string | null,
      date_of_birth: (raw.date_of_birth ?? raw.dateOfBirth ?? null) as string | null,
      gender: (raw.gender ?? null) as string | null,
      created_at: String(raw.created_at ?? ''),
      updated_at: String(raw.updated_at ?? ''),
    },
    department: null,
    position: null,
    location: null,
    shift: null,
    currentAssignment: null,
    stateHistory: [],
    assignmentHistory: [],
    hasLogin: Boolean(raw.has_login ?? raw.hasLogin),
    loginEmail: (raw.login_email ?? raw.loginEmail ?? null) as string | null,
    roleNames: (raw.role_names ?? raw.roleNames ?? []) as string[],
  } as EmployeeDetailDto
}

export async function getEmployeeDetail(employmentId: number): Promise<EmployeeDetailDto | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<Record<string, unknown>>(
        `/workforce/employments/${employmentId}`,
      )
      if (!data || data.id == null) return null
      return mapApiEmployeeDetail(data)
    } catch {
      return null
    }
  }
  await delay()
  const db = getDb()
  const emp = db.employments.find((e) => e.id === employmentId)
  if (!emp) return null
  const person = db.persons.find((p) => p.id === emp.person_id)
  const assignment = db.employment_assignments.find(
    (a) => a.employment_id === employmentId && a.effective_to == null,
  )
  const dept = assignment
    ? db.schema_departments.find((d) => d.id === assignment.department_id)
    : null
  const position = assignment ? db.positions.find((p) => p.id === assignment.position_id) : null
  const location = assignment ? db.locations.find((l) => l.id === assignment.location_id) : null
  const shift = assignment ? db.shifts.find((s) => s.id === assignment.shift_id) : null
  const login = ensureLoginUsers().find((u) => u.employment_id === employmentId)
  return {
    employment: emp,
    person: person!,
    department: dept ? { id: dept.id, name: dept.name } : null,
    position: position ? { id: position.id, name: position.name } : null,
    location: location ? { id: location.id, name: location.name } : null,
    shift: shift ? { id: shift.id, name: shift.name } : null,
    currentAssignment: assignment ?? null,
    stateHistory: [],
    assignmentHistory: assignment ? [assignment] : [],
    hasLogin: Boolean(login),
    loginEmail: login?.email ?? null,
    roleNames: [],
  } as EmployeeDetailDto
}

export async function createEmployment(input: CreateEmploymentSchemaInput) {
  if (!env.useMockApi) {
    const body = {
      first_name: input.firstName,
      last_name: input.lastName,
      personal_email: input.personalEmail || null,
      personal_phone: input.personalPhone || null,
      employee_code: input.employeeCode,
      employment_type: input.employmentType,
      joining_date: input.joiningDate,
      department_id: input.departmentId,
      position_id: input.positionId,
      location_id: input.locationId,
      shift_id: input.shiftId,
      work_mode: input.workMode ?? 'OFFICE',
      change_reason: input.changeReason ?? 'Initial assignment',
    }
    const { data } = await apiClient.post<Record<string, unknown>>('/workforce/employments', body)
    return mapApiEmployeeDetail(data)
  }
  await delay(400)
  const db = getDb()
  const now = new Date().toISOString()
  const personId = nextId(db.persons)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db.persons as any[]).push({
    id: personId,
    first_name: input.firstName,
    last_name: input.lastName,
    personal_email: input.personalEmail || null,
    personal_phone: input.personalPhone || null,
    address: null,
    date_of_birth: null,
    created_at: now,
    updated_at: now,
  })
  const empId = nextId(db.employments)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db.employments as any[]).push({
    id: empId,
    person_id: personId,
    employee_code: input.employeeCode,
    employment_type: input.employmentType,
    current_state: 'ONBOARDING',
    joining_date: input.joiningDate,
    leaving_date: null,
    created_at: now,
    updated_at: now,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db.employment_assignments as any[]).push({
    id: nextId(db.employment_assignments),
    employment_id: empId,
    department_id: input.departmentId,
    position_id: input.positionId,
    location_id: input.locationId,
    shift_id: input.shiftId,
    work_mode: input.workMode ?? 'OFFICE',
    effective_from: input.joiningDate,
    effective_to: null,
    change_reason: input.changeReason ?? 'Initial assignment',
    created_at: now,
    changed_by: 1,
  })
  return getEmployeeDetail(empId)
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
    currentState?: string
  },
) {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.firstName != null) body.first_name = patch.firstName
    if (patch.lastName != null) body.last_name = patch.lastName
    if (patch.personalEmail !== undefined) body.personal_email = patch.personalEmail
    if (patch.personalPhone !== undefined) body.personal_phone = patch.personalPhone
    if (patch.address !== undefined) body.address = patch.address
    if (patch.dateOfBirth !== undefined) body.date_of_birth = patch.dateOfBirth
    if (patch.currentState != null) body.current_state = patch.currentState
    const { data } = await apiClient.patch<Record<string, unknown>>(
      `/workforce/employments/${employmentId}`,
      body,
    )
    return mapApiEmployeeDetail(data)
  }
  await delay(300)
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
  if (patch.currentState) {
    emp.current_state = patch.currentState
    emp.updated_at = now
  }
  return getEmployeeDetail(employmentId)
}

export async function getOrgMastersForEmployeeForm() {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      departments: Array<{ id: number; name: string }>
      positions: Array<{ id: number; name: string }>
      locations: Array<{ id: number; name: string }>
      shifts: Array<{ id: number; name: string }>
    }>('/workforce/employments/org-masters')
    return data
  }
  await delay()
  const db = getDb()
  return {
    departments: db.schema_departments.filter((d) => !d.is_archived).map((d) => ({ id: d.id, name: d.name })),
    positions: db.positions.filter((p) => !p.is_archived).map((p) => ({ id: p.id, name: p.name })),
    locations: db.locations.filter((l) => !l.is_archived).map((l) => ({ id: l.id, name: l.name })),
    shifts: db.shifts.filter((s) => !s.is_archived).map((s) => ({ id: s.id, name: s.name })),
  }
}

export async function archivePosition(id: number): Promise<void> {
  if (!env.useMockApi) {
    await apiClient.post(`/organization/positions/${id}/archive`)
    return
  }
  await delay()
  const position = getDb().positions.find((p) => p.id === id)
  if (position) {
    ;(position as { is_archived: boolean }).is_archived = true
  }
}

export async function getEmploymentsByPerson(personId: number): Promise<EmploymentListItem[]> {
  if (!env.useMockApi) {
    const { items } = await listEmployments({ pageSize: 500 })
    return items.filter((e) => e.person_id === personId)
  }
  await delay()
  return getDb()
    .employments.filter((e) => e.person_id === personId)
    .map((e) => enrichListRow(e))
}

export async function changeEmploymentState(
  employmentId: number,
  newState: string,
  _reason?: string,
): Promise<EmployeeDetailDto | null> {
  return updateEmployment(employmentId, { currentState: newState })
}

export async function getEmploymentStateHistory(employmentId: number): Promise<unknown[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get(`/workforce/employments/${employmentId}/state-history`)
    return Array.isArray(data) ? data : []
  }
  await delay()
  return []
}

export async function createEmploymentAssignment(
  employmentId: number,
  input: {
    departmentId: number
    positionId: number
    locationId: number
    shiftId: number
    workMode?: string
    effectiveFrom: string
    changeReason?: string
  },
) {
  if (!env.useMockApi) {
    const { data } = await apiClient.post(`/workforce/employments/${employmentId}/assignments`, {
      department_id: input.departmentId,
      position_id: input.positionId,
      location_id: input.locationId,
      shift_id: input.shiftId,
      work_mode: input.workMode ?? 'OFFICE',
      effective_from: input.effectiveFrom,
      change_reason: input.changeReason ?? 'Assignment change',
    })
    return data
  }
  await delay(300)
  return { ok: true }
}

export async function getCurrentAssignment(employmentId: number): Promise<unknown> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get(
      `/workforce/employments/${employmentId}/assignments/current`,
    )
    return data
  }
  await delay()
  const db = getDb()
  const assignment = db.employment_assignments.find(
    (a) => a.employment_id === employmentId && a.effective_to == null,
  )
  return assignment ? { ...assignment } : null
}

export async function getEmploymentAssignmentHistory(
  employmentId: number,
): Promise<unknown[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<unknown[]>(
      `/workforce/employments/${employmentId}/assignments`,
    )
    return data
  }
  await delay()
  const db = getDb()
  return db.employment_assignments
    .filter((a) => a.employment_id === employmentId)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from))
}
