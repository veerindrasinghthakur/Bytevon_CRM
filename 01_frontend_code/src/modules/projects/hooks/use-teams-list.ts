import { useListControls } from '@/shared/hooks/useListControls'
import { useTeams } from './use-teams'

const FILTER_DEFAULTS = { status: '', department: '' }

export function useTeamsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const filters = {
    search: controls.search || undefined,
    status: controls.filters.status || undefined,
    department: controls.filters.department || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const { data, isLoading, isFetching, isError, refetch } = useTeams(filters)

  const items = data?.items ?? []
  const total = data?.total ?? items.length

  return {
    items,
    filtered: items,
    pageItems: items,
    totalCount: total,
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    department: controls.filters.department,
    setDepartment: (v: string) => controls.setFilter('department', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    isLoading,
    isFetching,
    isError,
    refetch,
  }
}
