import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'
import { listMyLeaveBalances, listMyLeaveRequests, requestLeaveCancel } from '../api/my-work'
import { useScopeParams } from '@/shared/rbac'

const FILTER_DEFAULTS = {
  status: 'All',
  type: 'All',
}

export function useMyLeave() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
    pageSize: 20,
  })

  const params = {
    search: controls.debouncedSearch || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  // Scope-tagged (SELF for self-service); key stays partitioned per scope.
  const scopedParams = useScopeParams('leave_request', params)

  const requestsQuery = useQuery({
    queryKey: queryKeys.myWork.leave.list({
      ...scopedParams,
      type: controls.filters.type,
    }),
    queryFn: () => listMyLeaveRequests(scopedParams),
    placeholderData: (prev) => prev,
  })

  const balancesQuery = useQuery({
    queryKey: queryKeys.myWork.leave.balances(),
    queryFn: listMyLeaveBalances,
  })

  const items = requestsQuery.data?.items ?? []
  const total = requestsQuery.data?.total ?? 0
  const balances = balancesQuery.data ?? []

  const filtered =
    controls.filters.type && controls.filters.type !== 'All'
      ? items.filter((r) => r.type === controls.filters.type)
      : items

  return {
    requests: filtered,
    total,
    balances,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    isLoading: requestsQuery.isLoading || balancesQuery.isLoading,
    isFetching: requestsQuery.isFetching,
    isError: requestsQuery.isError || balancesQuery.isError,
    error: requestsQuery.error ?? balancesQuery.error,
    refetch: () => {
      void requestsQuery.refetch()
      void balancesQuery.refetch()
    },
  }
}

export function useRequestLeaveCancel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => requestLeaveCancel(id),
    onSuccess: () => {
      void invalidate.myWorkLeave(qc)
      toast.success('Cancellation request sent to your approver')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not request cancellation'))
    },
  })
}
