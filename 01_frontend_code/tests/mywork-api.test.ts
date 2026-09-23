import { describe, expect, it } from 'vitest'
import { maskAccount } from '@/modules/my-work/lib/maskAccount'
import { getMyWorkOverview, listMyLeaveBalances } from '@/modules/my-work/api/my-work'

describe('maskAccount', () => {
  it('masks all but the last 4 digits', () => {
    expect(maskAccount('1234567890')).toBe('•••• •••• 7890')
    expect(maskAccount('ABCD')).toBe('•••• •••• ABCD')
  })
  it('fully masks short/empty input', () => {
    expect(maskAccount('')).toBe('••••')
    expect(maskAccount('12')).toBe('••••')
  })
})

describe('my-work mock API', () => {
  it('returns an overview object', async () => {
    const o = await getMyWorkOverview()
    expect(o).toBeTypeOf('object')
  })
  it('lists leave balances as an array', async () => {
    const b = await listMyLeaveBalances()
    expect(Array.isArray(b)).toBe(true)
  })
})
