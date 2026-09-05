/** Shared list query params + mock pagination slice. */

export interface ListPaginationParams {
  page?: number
  pageSize?: number
  search?: string
}

/** Extended list params used by workforce/sales/admin list APIs. */
export type EntityListParams = {
  search?: string
  page?: number
  pageSize?: number
  status?: string
  [key: string]: unknown
}

export interface ListResponse<T> {
  items: T[]
  total: number
}

export const DEFAULT_LIST_PAGE = 1
export const DEFAULT_LIST_PAGE_SIZE = 20

/** Apply page/pageSize to a filtered array (mock server-side pagination). */
export function paginateItems<T>(
  items: T[],
  page: number = DEFAULT_LIST_PAGE,
  pageSize: number = DEFAULT_LIST_PAGE_SIZE,
): ListResponse<T> {
  const safePage = Math.max(1, page || DEFAULT_LIST_PAGE)
  const safeSize = Math.max(1, pageSize || DEFAULT_LIST_PAGE_SIZE)
  const total = items.length
  const start = (safePage - 1) * safeSize
  return {
    items: items.slice(start, start + safeSize),
    total,
  }
}
