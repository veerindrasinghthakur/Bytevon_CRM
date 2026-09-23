import { describe, expect, it } from 'vitest'
import { ScopeName } from '@/shared/schema'
import { canWith, hasPermission } from '@/shared/rbac/can'
import type { EffectiveAuthorization } from '@/shared/rbac/types'

function auth(over: Partial<EffectiveAuthorization> = {}): EffectiveAuthorization {
  return {
    employmentId: 7,
    isSuperAdmin: false,
    permissions: { leave_request: { view: true, create: true } },
    scope: ScopeName.SELF,
    scopeByResource: {},
    ...over,
  }
}

describe('canWith', () => {
  it('denies without auth and allows super-admin unconditionally', () => {
    expect(canWith(null, { resource: 'anything', action: 'DELETE' })).toBe(false)
    expect(
      canWith(auth({ isSuperAdmin: true, permissions: {} }), { resource: 'x', action: 'VIEW' }),
    ).toBe(true)
  })
  it('checks the permission tree (case-insensitive action)', () => {
    const a = auth()
    expect(canWith(a, { resource: 'leave_request', action: 'VIEW' })).toBe(true)
    expect(canWith(a, { resource: 'leave_request', action: 'view' })).toBe(true)
    expect(canWith(a, { resource: 'leave_request', action: 'DELETE' })).toBe(false)
    expect(canWith(a, { resource: 'payroll', action: 'VIEW' })).toBe(false)
  })
  it('enforces minScope ranking (SELF < DEPARTMENT < ORGANIZATION)', () => {
    const dept = auth({ scope: ScopeName.DEPARTMENT, scopeByResource: { leave_request: ScopeName.DEPARTMENT } })
    expect(canWith(dept, { resource: 'leave_request', action: 'VIEW', minScope: 'SELF' })).toBe(true)
    expect(canWith(dept, { resource: 'leave_request', action: 'VIEW', minScope: 'ORGANIZATION' })).toBe(false)
    expect(hasPermission(dept, 'leave_request', 'VIEW')).toBe(true)
  })
})
