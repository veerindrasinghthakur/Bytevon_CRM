import { delay, getDb, nextId } from '@/shared/mock/db'

export interface Employee {
  id: number
  userId?: number | null
  employeeCode: string
  fullName: string
  email: string
  department?: string
  role?: string
  status: string
  joiningDate?: string
  workType?: string
}

export interface Department {
  id: number
  name: string
  code?: string
  headName?: string | null
  employeeCount: number
  status: string
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asEmployee(row: any): Employee {
  return { ...row }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asDepartment(row: any): Department {
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
}): Promise<Employee> {
  await delay(400)
  const employees = getDb().employees
  const id = nextId(employees)
  const row = {
    id,
    userId: null,
    employeeCode: `EMP-${String(id).padStart(3, '0')}`,
    fullName: input.fullName,
    email: input.email,
    department: input.department ?? 'Engineering',
    role: 'Member',
    status: 'ACTIVE',
    joiningDate: new Date().toISOString().slice(0, 10),
    workType: 'Hybrid',
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

export async function createDepartment(input: { name: string; code?: string }): Promise<Department> {
  await delay(400)
  const departments = getDb().departments
  const row = {
    id: nextId(departments),
    name: input.name,
    code: input.code ?? input.name.slice(0, 3).toUpperCase(),
    headName: null,
    employeeCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  departments.unshift(row)
  return asDepartment(row)
}
