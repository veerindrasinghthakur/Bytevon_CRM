import { describe, expect, it } from 'vitest'
import { buildMonthGrid, CALENDAR_DAY_LABELS } from '@/modules/dashboard/lib/dashboard-calendar'

describe('dashboard calendar', () => {
  it('day labels intentionally abbreviate (dupes) so consumers must use index keys', () => {
    // ['S','M','T','W','T','F','S'] — 'T' (Tue/Thu) and 'S' (Sat/Sun) repeat.
    // ExecutiveDashboardPage renders them with key={`${d}-${i}`}.
    expect(CALENDAR_DAY_LABELS).toHaveLength(7)
    expect(new Set(CALENDAR_DAY_LABELS).size).toBeLessThan(7)
  })

  it('buildMonthGrid emits unique cell keys', () => {
    for (const base of [new Date(2030, 0, 1), new Date(2030, 5, 1), new Date(2030, 8, 22)]) {
      const cells = buildMonthGrid(base)
      const keys = cells.map((c) => c.key)
      expect(new Set(keys).size).toBe(keys.length)
      expect(cells.length % 7).toBe(0)
    }
  })
})
