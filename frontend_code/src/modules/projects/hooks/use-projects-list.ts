import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { useProjects } from './use-projects'

const FILTER_DEFAULTS = { status: '' }

export function useProjectsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isFetching, isError, refetch } = useProjects({
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  })

  const pageItems = data?.items ?? []
  const total = data?.total ?? 0
  const metrics = data?.metrics

  const selection = useListSelection({
    items: pageItems,
    getId: (p) => String(p.id),
  })

  return {
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    /** Alias: full filtered set is no longer client-held; use pageItems for rows */
    items: pageItems,
    pageItems,
    total,
    active: metrics?.active ?? 0,
    atRisk: metrics?.atRisk ?? 0,
    avgProgress: metrics?.avgProgress ?? 0,
    isLoading,
    isFetching,
    isError,
    refetch,
    selection,
  }
}
