import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_PAGE_SIZE, paginate } from '@/shared/components/ui/Pagination'

export interface UseListPaginationOptions {
  pageSize?: number
  initialPage?: number
}

export interface UseListPaginationResult {
  page: number
  setPage: (page: number) => void
  pageSize: number
  resetPage: () => void
  /** Slice items for the current page */
  pageItems: <T>(items: T[]) => T[]
  /** Inclusive range labels for footer copy */
  range: (total: number) => { from: number; to: number; total: number }
}

/**
 * Shared client-side pagination for list hooks.
 * Pair with shared `Pagination` UI component.
 *
 * Call `resetPage()` when search/filters change so users land on page 1.
 */
export function useListPagination(
  options: UseListPaginationOptions = {},
): UseListPaginationResult {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const [page, setPageState] = useState(options.initialPage ?? 1)

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(1, p))
  }, [])

  const resetPage = useCallback(() => {
    setPageState(1)
  }, [])

  const pageItems = useCallback(
    <T,>(items: T[]): T[] => paginate(items, page, pageSize),
    [page, pageSize],
  )

  const range = useCallback(
    (total: number) => {
      if (total === 0) return { from: 0, to: 0, total: 0 }
      const from = (page - 1) * pageSize + 1
      const to = Math.min(page * pageSize, total)
      return { from, to, total }
    },
    [page, pageSize],
  )

  return {
    page,
    setPage,
    pageSize,
    resetPage,
    pageItems,
    range,
  }
}

/**
 * Memoized page slice — preferred when items are already in a useMemo chain.
 */
export function usePageItems<T>(
  items: T[],
  page: number,
  pageSize = DEFAULT_PAGE_SIZE,
): T[] {
  return useMemo(() => paginate(items, page, pageSize), [items, page, pageSize])
}
