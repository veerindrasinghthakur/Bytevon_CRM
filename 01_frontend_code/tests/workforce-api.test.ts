import { describe, expect, it } from 'vitest'
import { listDepartments, listEmployeesNotInDepartment } from '@/modules/workforce/api/departments'
import { listEmployments } from '@/modules/workforce/api/employment'
import { listPersons } from '@/modules/workforce/api/person'
import { createDepartmentSchema } from '@/modules/workforce/schemas/department'
import { createEmploymentSchema } from '@/modules/workforce/schemas/employment'

describe('workforce schemas', () => {
  it('requires a department name', () => {
    expect(createDepartmentSchema.safeParse({ name: 'Research' }).success).toBe(true)
    expect(createDepartmentSchema.safeParse({ name: '' }).success).toBe(false)
  })
  it('rejects empty employment payloads', () => {
    expect(createEmploymentSchema.safeParse({}).success).toBe(false)
  })
})

describe('workforce mock API', () => {
  it('lists departments, employments and persons', async () => {
    const d = await listDepartments()
    expect(Array.isArray(d.items ?? d)).toBe(true)
    const e = await listEmployments()
    expect(Array.isArray(e.items ?? e)).toBe(true)
    const p = await listPersons()
    expect(Array.isArray(p.items ?? p)).toBe(true)
  })
  it('lists employees-not-in-department without crashing', async () => {
    const d = await listDepartments()
    const rows = d.items ?? d
    if (!rows.length) return
    const res = await listEmployeesNotInDepartment(rows[0].id)
    expect(Array.isArray(res)).toBe(true)
  })
})
