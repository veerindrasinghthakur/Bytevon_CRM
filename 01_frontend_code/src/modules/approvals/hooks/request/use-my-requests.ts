import { useQuery } from '@tanstack/react-query'
import { listMyRequests } from '../../api/request'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { useScopeParams } from '@/shared/rbac'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useMyRequests() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  // Scope-tagged: backend enforces the boundary; key stays partitioned per scope.
  const scopedParams = useScopeParams('approval', {
    search: controls.debouncedSearch,
    status: controls.filters.status,
  })

  const query = useQuery({
    queryKey: queryKeys.approvals.myRequests(scopedParams),
    queryFn: () =>
      listMyRequests({
        search: controls.debouncedSearch || undefined,
        status: controls.filters.status,
        scope: scopedParams.scope,
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
