import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
  paginateItems,
} from '@/shared/lib/list-params'

describe('paginateItems', () => {
  const rows = [1, 2, 3, 4, 5]
  it('slices page 1 and reports total', () => {
    expect(paginateItems(rows, 1, 2)).toEqual({ items: [1, 2], total: 5 })
  })
  it('slices later pages and clamps overflow to []', () => {
    expect(paginateItems(rows, 3, 2)).toEqual({ items: [5], total: 5 })
    expect(paginateItems(rows, 9, 2)).toEqual({ items: [], total: 5 })
  })
  it('guards non-positive page/size with defaults', () => {
    const r = paginateItems(rows, 0, 0)
    expect(r.total).toBe(5)
    expect(r.items.length).toBeLessThanOrEqual(DEFAULT_LIST_PAGE_SIZE)
    expect(DEFAULT_LIST_PAGE).toBe(1)
  })
})
