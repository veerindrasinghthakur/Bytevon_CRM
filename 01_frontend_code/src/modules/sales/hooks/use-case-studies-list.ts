import { useMemo } from 'react'
import { useListControls } from '@/shared/hooks/useListControls'
import { useCaseStudiesQuery } from './use-sales'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useCaseStudiesList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isFetching, isError, refetch } = useCaseStudiesQuery({
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status,
    page: controls.page,
    pageSize: controls.pageSize,
  })

  const pageItems = data?.items ?? []
  const totalCount = data?.total ?? 0
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])

  return {
    items: pageItems,
    /** Current page rows (server-filtered + paginated) */
    filtered: pageItems,
    pageItems,
    totalCount,
    metrics,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
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
