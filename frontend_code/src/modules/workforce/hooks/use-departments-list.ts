import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { listDepartments } from '../api/departments'
import { computeDepartmentListMetrics } from '@/shared/compute/workforce-metrics'
import { queryKeys } from '@/shared/lib/query-keys'

const FILTER_DEFAULTS = { status: 'All' }

export function useDepartmentsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const listFilters = {
    includeArchived: true,
    search: controls.debouncedSearch || undefined,
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
        // Full set for metrics + client page until server filters are complete
        page: undefined,
        pageSize: undefined,
      }),
  })

  const items = data?.items ?? []

  const metrics = useMemo(() => computeDepartmentListMetrics(items), [items])

  const filtered = useMemo(() => {
    return items.filter((d) => {
      const q = controls.debouncedSearch.toLowerCase().trim()
      const matchQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.headName.toLowerCase().includes(q)
      const matchS = controls.filters.status === 'All' || d.status === controls.filters.status
      return matchQ && matchS
    })
  }, [items, controls.debouncedSearch, controls.filters.status])

  const pageItems = useMemo(() => controls.pageItems(filtered), [controls, filtered])

  return {
    items,
    filtered,
    pageItems,
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
