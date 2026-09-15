import { useQuery } from '@tanstack/react-query'
import { listMyRequests } from '../../api/request'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useMyRequests() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const query = useQuery({
    queryKey: queryKeys.approvals.myRequests({
      search: controls.debouncedSearch,
      status: controls.filters.status,
    }),
    queryFn: () =>
      listMyRequests({
        search: controls.debouncedSearch || undefined,
        status: controls.filters.status,
      }),
  })

  const items = query.data ?? []

  return {
    items,
    filtered: items,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
