import { describe, expect, it } from 'vitest'
import { ScopeName } from '@/shared/schema'
import { dataScope, dataScopeFor, withAuthScope, withScope } from '@/shared/rbac/scope'

describe('scope helpers', () => {
  it('defaults to SELF without auth', () => {
    expect(dataScope(null)).toBe('SELF')
    expect(dataScopeFor(undefined, 'leave_request')).toBe('SELF')
  })
  it('prefers per-resource scope over overall', () => {
    const a = { scope: ScopeName.SELF, scopeByResource: { leave_request: ScopeName.DEPARTMENT } } as never
    expect(dataScopeFor(a, 'leave_request')).toBe('DEPARTMENT')
    expect(dataScopeFor(a, 'payroll')).toBe('SELF')
  })
  it('withScope never overwrites an explicit caller scope', () => {
    expect(withScope({ scope: 'TEAM' } as never, ScopeName.ORGANIZATION)).toMatchObject({ scope: 'TEAM' })
    expect(withScope({ q: 1 }, ScopeName.TEAM)).toMatchObject({ q: 1, scope: 'TEAM' })
    expect(withScope({ q: 1 }, undefined)).toEqual({ q: 1 })
  })
  it('withAuthScope merges auth scope into list params', () => {
    const a = { scope: ScopeName.TEAM, scopeByResource: {} } as never
    expect(withAuthScope({ search: 'x' }, a, 'attendance')).toMatchObject({ scope: 'TEAM' })
  })
})
