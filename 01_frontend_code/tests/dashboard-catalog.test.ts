import { describe, expect, it } from 'vitest'
import { HOME_QUICK_ACTIONS, MAX_QUICK_ACTIONS } from '@/modules/dashboard/catalog'

describe('dashboard catalog', () => {
  it('caps quick actions at MAX_QUICK_ACTIONS with unique ids', () => {
    expect(MAX_QUICK_ACTIONS).toBe(8)
    const ids = HOME_QUICK_ACTIONS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const a of HOME_QUICK_ACTIONS) {
      expect(a.label.length).toBeGreaterThan(0)
      expect(a.to.startsWith('/')).toBe(true)
    }
  })

  it('orders quick actions by ascending priority', () => {
    const pris = HOME_QUICK_ACTIONS.map((a) => a.priority)
    expect([...pris].sort((x, y) => x - y)).toEqual(pris)
  })
})
