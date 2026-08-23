import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMyTasks } from '../api/my-work'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useMyTasks() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const query = useQuery({
    queryKey: queryKeys.myWork.tasks.list({
      search: controls.debouncedSearch,
      status: controls.filters.status,
    }),
    queryFn: () =>
      listMyTasks({
        search: controls.debouncedSearch || undefined,
        status: controls.filters.status,
      }),
  })

  const tasks = useMemo(() => query.data ?? [], [query.data])

  return {
    tasks,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  }
}
