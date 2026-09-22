import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { listMyLeaveBalances, listMyLeaveRequests, requestLeaveCancel } from '../api/my-work'

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

  const requestsQuery = useQuery({
    queryKey: queryKeys.myWork.leave.list({
      ...params,
      type: controls.filters.type,
    }),
    queryFn: () => listMyLeaveRequests(params),
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
    onSuccess: () => invalidate.myWorkLeave(qc),
  })
}
