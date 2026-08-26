import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { listDepartments } from '../api/departments'
import { queryKeys } from '@/shared/lib/query-keys'

const FILTER_DEFAULTS = { status: 'All' }

export function useDepartmentsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const listFilters = {
    includeArchived: true,
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.workforce.departments.list(listFilters),
    queryFn: () =>
      listDepartments({
        includeArchived: true,
        search: listFilters.search,
        status: listFilters.status,
        page: listFilters.page,
        pageSize: listFilters.pageSize,
      }),
  })

  const pageItems = data?.items ?? []
  const totalCount = data?.total ?? 0
  const metrics = data?.metrics ?? { total: 0, active: 0, inactive: 0, staffing: 0 }

  return {
    /** Current page rows (server-paginated) */
    pageItems,
    /** Alias for empty-state checks against total filtered count */
    filtered: pageItems,
    totalCount,
    metrics,
    loading: isLoading,
    isLoading,
    error: isError,
    isError,
    isFetching,
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    reload: () => void refetch(),
    refetch,
  }
}
