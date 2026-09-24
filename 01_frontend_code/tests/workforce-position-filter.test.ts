import { describe, expect, it } from 'vitest'
import { filterPositionsByDepartment } from '@/modules/workforce/types'
import { getOrgMastersForEmployeeForm } from '@/modules/workforce/api/employment'

const rows = [
  { id: 1, name: 'HR Partner', departmentId: 10 },
  { id: 2, name: 'Backend Dev', departmentId: 20 },
  { id: 3, name: 'Floater', departmentId: null },
]

describe('filterPositionsByDepartment', () => {
  it('returns scoped rows plus unassigned legacy rows', () => {
    expect(filterPositionsByDepartment(rows, '10').map((p) => p.id)).toEqual([1, 3])
    expect(filterPositionsByDepartment(rows, 20).map((p) => p.id)).toEqual([2, 3])
  })
  it('returns everything without a department selection', () => {
    expect(filterPositionsByDepartment(rows, '')).toHaveLength(3)
    expect(filterPositionsByDepartment(rows, null)).toHaveLength(3)
    expect(filterPositionsByDepartment(rows, undefined)).toHaveLength(3)
  })
})

describe('getOrgMastersForEmployeeForm', () => {
  it('carries departmentId on positions (mock seed)', async () => {
    const m = await getOrgMastersForEmployeeForm()
    expect(Array.isArray(m.departments)).toBe(true)
    for (const p of m.positions) {
      expect(p).toHaveProperty('departmentId')
    }
  })
})
