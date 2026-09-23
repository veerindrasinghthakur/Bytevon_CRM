import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'

describe('env', () => {
  it('exposes mock flag (boolean) and API base URL (string)', () => {
    expect(typeof env.useMockApi).toBe('boolean')
    expect(typeof env.apiBaseUrl).toBe('string')
    expect(env.apiBaseUrl.length).toBeGreaterThan(0)
  })
  it('forces mock mode under vitest config', () => {
    expect(env.useMockApi).toBe(true)
  })
})
