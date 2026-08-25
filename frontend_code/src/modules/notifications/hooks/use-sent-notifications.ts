import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { computeSentKpis, listSentNotifications } from '../api/notifications'
import { queryKeys } from '@/shared/lib/query-keys'

const FILTER_DEFAULTS = { type: 'All', status: 'All' }

export function useSentNotifications() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
    pageSize: 20,
  })

  const params = useMemo(
    () => ({
      search: controls.search || undefined,
      typeFilter: controls.filters.type || 'All',
      statusFilter: controls.filters.status || 'All',
      page: controls.page,
      pageSize: controls.pageSize,
    }),
    [controls.search, controls.filters.type, controls.filters.status, controls.page, controls.pageSize],
  )

  const query = useQuery({
    queryKey: queryKeys.notifications.sent(params),
    queryFn: () => listSentNotifications(params),
    placeholderData: (prev) => prev,
  })

  /** Unfiltered snapshot for KPIs */
  const allQuery = useQuery({
    queryKey: [...queryKeys.notifications.all, 'sent-all'] as const,
    queryFn: () => listSentNotifications({ page: 1, pageSize: 500 }),
  })

  const rows = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const allRows = allQuery.data?.items ?? rows

  return {
    isLoading: query.isLoading,
    kpis: computeSentKpis(allRows),
    rows,
    total,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
    search: controls.search,
    setSearch: controls.setSearch,
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    resetFilters: controls.resetAll,
    filtersActive: controls.anyActive,
  }
}
