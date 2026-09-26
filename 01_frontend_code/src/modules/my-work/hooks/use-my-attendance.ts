import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { getMyWeekHours, getMyWorkTodayInfo, listMyAttendance } from '../api/my-work'
import { useScopeParams } from '@/shared/rbac'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useMyAttendance() {
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
  const scopedParams = useScopeParams('attendance', params)

  const query = useQuery({
    queryKey: queryKeys.myWork.attendance.list(scopedParams),
    queryFn: () => listMyAttendance(scopedParams),
    placeholderData: (prev) => prev,
  })

  const todayInfoQuery = useQuery({
    queryKey: queryKeys.myWork.attendance.todayInfo(),
    queryFn: getMyWorkTodayInfo,
  })

  const weekHoursQuery = useQuery({
    queryKey: queryKeys.myWork.attendance.weekHours(),
    queryFn: getMyWeekHours,
  })

  return {
    records: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    todayInfo: todayInfoQuery.data,
    weekHours: weekHoursQuery.data ?? [],
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    isTodayLoading: todayInfoQuery.isLoading,
    isWeekLoading: weekHoursQuery.isLoading,
  }
}
