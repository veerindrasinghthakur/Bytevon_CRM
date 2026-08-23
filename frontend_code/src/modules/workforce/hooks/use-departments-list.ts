import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { listDepartments } from '../api/departments'
import { computeDepartmentListMetrics } from '@/shared/compute/workforce-metrics'

export const DEPARTMENTS_LIST_KEY = ['workforce', 'departments', 'list'] as const

const FILTER_DEFAULTS = { status: 'All' }

export function useDepartmentsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, { includeArchived: true }],
    queryFn: () => listDepartments({ includeArchived: true }),
  })

  const items = data?.items ?? []

  const metrics = useMemo(() => computeDepartmentListMetrics(items), [items])

  const filtered = useMemo(() => {
    return items.filter((d) => {
      const q = controls.search.toLowerCase()
      const matchQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.headName.toLowerCase().includes(q)
      const matchS = controls.filters.status === 'All' || d.status === controls.filters.status
      return matchQ && matchS
    })
  }, [items, controls.search, controls.filters.status])

  const pageItems = controls.pageItems(filtered)

  return {
    items,
    filtered,
    pageItems,
    metrics,
    loading: isLoading,
    error: isError,
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
