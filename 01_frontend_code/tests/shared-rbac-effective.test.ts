import { describe, expect, it } from 'vitest'
import { ScopeName } from '@/shared/schema'
import { buildEffectiveAuthorization } from '@/shared/rbac/build-effective'

describe('buildEffectiveAuthorization', () => {
  it('returns deny-all SELF baseline for employment with no roles', () => {
    const a = buildEffectiveAuthorization(-99999)
    expect(a.isSuperAdmin).toBe(false)
    expect(a.scope).toBe(ScopeName.SELF)
    expect(a.permissions).toEqual({})
  })
})
