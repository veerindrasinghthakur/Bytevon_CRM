/**
 * Employment API helpers — enrich/map helpers for list + detail.
 */

import { getDb } from '@/shared/mock/db'
import type {
  EmployeeDetailDto,
  EmploymentRow,
  LoginUserRow,
} from '@/shared/schema'

export function ensureLoginUsers(): LoginUserRow[] {
  const db = getDb() as ReturnType<typeof getDb> & { login_users?: LoginUserRow[] }
  if (!db.login_users) db.login_users = []
  return db.login_users
}

export function enrichListRow(e: EmploymentRow) {
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
    id: e.id,
    employeeCode: e.employee_code,
    currentState: e.current_state,
    employmentType: e.employment_type,
    joiningDate: e.joining_date,
    status: e.current_state === 'TERMINATED' || e.current_state === 'RESIGNED' || e.current_state === 'ALUMNI'
      ? 'Inactive'
      : 'Active',
  }
}

export function buildMetrics(items: ReturnType<typeof enrichListRow>[]) {
  const active = items.filter((i) => i.status === 'Active').length
  return {
    total: items.length,
    active,
    inactive: items.length - active,
  }
}

export function mapApiEmployment(row: Record<string, unknown>): ReturnType<typeof enrichListRow> {
  const id = Number(row.id)
  const first = String(row.first_name ?? row.firstName ?? '')
  const last = String(row.last_name ?? row.lastName ?? '')
  const code = String(row.employee_code ?? row.employeeCode ?? `EMP-${id}`)
  const state = String(row.current_state ?? row.currentState ?? 'CONFIRMED')
  const fullName = `${first} ${last}`.trim() || code
  return {
    id,
    person_id: Number(row.person_id ?? row.personId ?? 0),
    employee_code: code,
    employment_type: String(row.employment_type ?? row.employmentType ?? 'FULL_TIME') as never,
    current_state: state as never,
    joining_date: String(row.joining_date ?? row.joiningDate ?? ''),
    leaving_date: (row.leaving_date ?? row.leavingDate ?? null) as string | null,
    created_at: String(row.created_at ?? row.createdAt ?? ''),
    updated_at: String(row.updated_at ?? row.updatedAt ?? ''),
    fullName,
    firstName: first,
    lastName: last,
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    departmentName: String(row.department_name ?? row.departmentName ?? '—'),
    departmentId:
      row.department_id != null || row.departmentId != null
        ? Number(row.department_id ?? row.departmentId)
        : null,
    positionName: String(row.position_name ?? row.positionName ?? '—'),
    locationName: String(row.location_name ?? row.locationName ?? '—'),
    employeeCode: code,
    currentState: state,
    employmentType: String(row.employment_type ?? row.employmentType ?? 'FULL_TIME'),
    joiningDate: String(row.joining_date ?? row.joiningDate ?? ''),
    status:
      state === 'TERMINATED' || state === 'RESIGNED' || state === 'ALUMNI' ? 'Inactive' : 'Active',
  }
}

export function mapApiEmployeeDetail(raw: Record<string, unknown>): EmployeeDetailDto {
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
      employment_type: String(raw.employment_type ?? raw.employmentType ?? 'FULL_TIME') as never,
      current_state: String(raw.current_state ?? raw.currentState ?? 'CONFIRMED') as never,
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
    department: raw.department
      ? (raw.department as EmployeeDetailDto['department'])
      : raw.department_name || raw.departmentName
        ? {
            id: Number(raw.department_id ?? raw.departmentId ?? 0),
            name: String(raw.department_name ?? raw.departmentName),
          }
        : null,
    position: raw.position
      ? (raw.position as EmployeeDetailDto['position'])
      : raw.position_name || raw.positionName
        ? {
            id: Number(raw.position_id ?? raw.positionId ?? 0),
            name: String(raw.position_name ?? raw.positionName),
          }
        : null,
    location: raw.location
      ? (raw.location as EmployeeDetailDto['location'])
      : raw.location_name || raw.locationName
        ? {
            id: Number(raw.location_id ?? raw.locationId ?? 0),
            name: String(raw.location_name ?? raw.locationName),
          }
        : null,
    shift: (raw.shift as EmployeeDetailDto['shift']) ?? null,
    currentAssignment: (raw.current_assignment ??
      raw.currentAssignment ??
      null) as EmployeeDetailDto['currentAssignment'],
    stateHistory: (raw.state_history ?? raw.stateHistory ?? []) as EmployeeDetailDto['stateHistory'],
    assignmentHistory: (raw.assignment_history ??
      raw.assignmentHistory ??
      []) as EmployeeDetailDto['assignmentHistory'],
    hasLogin: Boolean(raw.has_login ?? raw.hasLogin),
    loginEmail: (raw.login_email ?? raw.loginEmail ?? null) as string | null,
    roleNames: (raw.role_names ?? raw.roleNames ?? []) as string[],
  }
}
