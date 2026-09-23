import { describe, expect, it } from 'vitest'
import { emptyMatrix, matrixToPermissions, seedMatrix } from '@/modules/admin/lib/role-matrix'

const MODULES = ['Users', 'Roles', 'Sales']
const ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE']

describe('emptyMatrix', () => {
  it('creates a false-filled row per module', () => {
    const m = emptyMatrix(MODULES, ACTIONS)
    expect(Object.keys(m)).toEqual(MODULES)
    for (const mod of MODULES) {
      expect(m[mod]).toEqual({
        VIEW: false,
        CREATE: false,
        UPDATE: false,
        DELETE: false,
      })
    }
  })

  it('handles empty inputs', () => {
    expect(emptyMatrix([], [])).toEqual({})
    expect(emptyMatrix(['Users'], [])).toEqual({ Users: {} })
  })
})

describe('matrixToPermissions', () => {
  it('emits only enabled cells as lowercase module.action strings', () => {
    const matrix = emptyMatrix(MODULES, ACTIONS)
    matrix['Users'].VIEW = true
    matrix['Users'].DELETE = true
    matrix['Sales'].CREATE = true
    expect(matrixToPermissions(matrix).sort()).toEqual([
      'sales.create',
      'users.delete',
      'users.view',
    ])
  })

  it('returns [] for an all-false matrix and tolerates missing rows', () => {
    expect(matrixToPermissions(emptyMatrix(MODULES, ACTIONS))).toEqual([])
    expect(matrixToPermissions({ Users: undefined as never })).toEqual([])
  })
})

describe('seedMatrix', () => {
  it('enables exactly the stored module.action cells (exact match)', () => {
    // "users.view" and "users.create" enable exactly those two cells.
    const m = seedMatrix(['users.view', 'users.create'], MODULES, ACTIONS)
    expect(m['Users']).toEqual({ VIEW: true, CREATE: true, UPDATE: false, DELETE: false })
    // "Sales" has no matching permissions → all false
    expect(m['Roles']).toEqual({ VIEW: false, CREATE: false, UPDATE: false, DELETE: false })
  })

  it('does NOT grant all actions on all modules via "manage" catch-all', () => {
    // "reports.manage" does NOT start with "users." → no module matches
    const m = seedMatrix(['reports.manage'], MODULES, ACTIONS)
    for (const mod of MODULES) {
      expect(m[mod]).toEqual({ VIEW: false, CREATE: false, UPDATE: false, DELETE: false })
    }
  })

  it('prefix-like similarity no longer causes false matches', () => {
    // "user_roles.manage" does NOT start with "users." → Users row stays false
    const m = seedMatrix(['user_roles.manage'], ['Users'], ACTIONS)
    expect(m['Users'].VIEW).toBe(false)
  })

  it('module "Sales" matched only for the exact stored cell', () => {
    // "sales.create" enables exactly Sales.CREATE — nothing else.
    const m = seedMatrix(['sales.create'], MODULES, ACTIONS)
    expect(m['Sales']).toEqual({ VIEW: false, CREATE: true, UPDATE: false, DELETE: false })
    expect(m['Users']).toEqual({ VIEW: false, CREATE: false, UPDATE: false, DELETE: false })
    expect(m['Roles']).toEqual({ VIEW: false, CREATE: false, UPDATE: false, DELETE: false })
  })
})
