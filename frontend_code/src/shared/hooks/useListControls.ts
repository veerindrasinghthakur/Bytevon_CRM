import { useCallback } from 'react'
import { useListSearch } from './useListSearch'
import { useListFilters, type FilterValues } from './useListFilters'
import { useListPagination, type UseListPaginationOptions } from './useListPagination'

export interface UseListControlsOptions<T extends FilterValues> {
  /** Filter defaults (also used by reset) */
  filterDefaults: T
  /** Optional pagination config */
  pagination?: UseListPaginationOptions
  /** Initial search */
  initialSearch?: string
}

/**
 * One-stop list controls: search + named filters + client pagination.
 * Resets page to 1 whenever search or a filter changes.
 *
 * Usage in a list hook:
 *   const controls = useListControls({
 *     filterDefaults: { status: 'All', category: 'All' },
 *   })
 *   // controls.search, controls.setSearch
 *   // controls.filters.status, controls.setFilter('status', v)
 *   // controls.page, controls.setPage, controls.pageItems(filtered)
 *   // controls.resetAll(), controls.filtersActive || controls.hasSearch
 */
export function useListControls<T extends FilterValues>(options: UseListControlsOptions<T>) {
  const pagination = useListPagination(options.pagination)

  const search = useListSearch({
    initial: options.initialSearch,
    onChange: () => pagination.resetPage(),
  })

  const filters = useListFilters<T>({
    defaults: options.filterDefaults,
    onChange: () => pagination.resetPage(),
  })

  const resetAll = useCallback(() => {
    search.clearSearch()
    filters.resetFilters()
    pagination.resetPage()
  }, [search, filters, pagination])

  const anyActive = search.hasSearch || filters.filtersActive

  return {
    // search
    search: search.search,
    setSearch: search.setSearch,
    clearSearch: search.clearSearch,
    hasSearch: search.hasSearch,
    // filters
    filters: filters.filters,
    setFilter: filters.setFilter,
    setFilters: filters.setFilters,
    resetFilters: filters.resetFilters,
    filtersActive: filters.filtersActive,
    getFilter: filters.get,
    // pagination
    page: pagination.page,
    setPage: pagination.setPage,
    pageSize: pagination.pageSize,
    resetPage: pagination.resetPage,
    pageItems: pagination.pageItems,
    range: pagination.range,
    // combined
    resetAll,
    anyActive,
  }
}
