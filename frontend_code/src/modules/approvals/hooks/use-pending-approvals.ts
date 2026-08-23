import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPendingApprovals } from '../api/approvals'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'

const FILTER_DEFAULTS = {
  type: 'All',
  priority: 'All',
}

export function usePendingApprovals() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const query = useQuery({
    queryKey: queryKeys.approvals.pending({
      search: controls.debouncedSearch,
      type: controls.filters.type,
      priority: controls.filters.priority,
    }),
    queryFn: () =>
      listPendingApprovals({
        search: controls.debouncedSearch || undefined,
        type: controls.filters.type,
        priority: controls.filters.priority,
      }),
  })

  const filtered = query.data ?? []

  const types = useMemo(
    () => Array.from(new Set(filtered.map((r) => r.type))).sort(),
    [filtered],
  )

  return {
    items: filtered,
    filtered,
    search: controls.search,
    setSearch: controls.setSearch,
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
    priorityFilter: controls.filters.priority,
    setPriorityFilter: (v: string) => controls.setFilter('priority', v),
    types,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  }
}
