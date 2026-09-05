import { delay, getDb, nextId } from '@/shared/mock/db'
import {
  legacyDepartmentCreationDefaults,
  legacyEmployeeCreationDefaults,
  teams,
  departments,
  employees,
  candidateMembers,
  assignableProjects,
  membersFor,
  canCreateShift,
  shifts,
  employeesOnShift,
} from '@/shared/mock/data/workforce'
import type { LegacyDepartment, LegacyEmployee } from '../types'

export type { LegacyDepartment as Department, LegacyEmployee as Employee } from '../types'

export const listWorkforceTeams = () => Object.values(teams)
export const listWorkforceDepartments = () => Object.values(departments)
export const listWorkforceEmployees = () => Object.values(employees)
export const listCandidateMembers = () => candidateMembers
export const listAssignableProjects = () => assignableProjects
export const listWorkforceTeamMembers = (teamId: string) => membersFor(teamId)
export const canCreateWorkforceShift = canCreateShift
export const listWorkforceShifts = () => shifts
export const getWorkforceShift = (shiftId: string) => shifts.find((shift) => shift.id === shiftId) ?? shifts[0]
export const listWorkforceShiftEmployees = (shiftId: string) => employeesOnShift(shiftId)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asEmployee(row: any): LegacyEmployee {
  return { ...row }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asDepartment(row: any): LegacyDepartment {
  return { ...row }
}

export async function getEmployees(params?: { search?: string }) {
  await delay()
  let items = getDb().employees.map(asEmployee)
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department ?? '').toLowerCase().includes(q)
    )
  }
  return { items, total: items.length }
}

export async function createEmployee(input: {
  fullName: string
  email: string
  department?: string
}): Promise<LegacyEmployee> {
  await delay(400)
  const employees = getDb().employees
  const id = nextId(employees)
  const row = {
    id,
    userId: null,
    employeeCode: `EMP-${String(id).padStart(3, '0')}`,
    fullName: input.fullName,
    email: input.email,
    ...legacyEmployeeCreationDefaults,
    department: input.department ?? legacyEmployeeCreationDefaults.department,
    joiningDate: new Date().toISOString().slice(0, 10),
  }
  employees.unshift(row)
  return asEmployee(row)
}

export async function getDepartments(params?: { search?: string }) {
  await delay()
  let items = getDb().departments.map(asDepartment)
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.code ?? '').toLowerCase().includes(q) ||
        (d.headName ?? '').toLowerCase().includes(q)
    )
  }
  return { items, total: items.length }
}

export async function createDepartment(input: { name: string; code?: string }): Promise<LegacyDepartment> {
  await delay(400)
  const departments = getDb().departments
  const row = {
    id: nextId(departments),
    name: input.name,
    code: input.code ?? input.name.slice(0, 3).toUpperCase(),
    ...legacyDepartmentCreationDefaults,
    createdAt: new Date().toISOString(),
  }
  departments.unshift(row)
  return asDepartment(row)
}
