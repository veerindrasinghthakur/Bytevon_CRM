import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { computeSentKpis, listSentNotifications } from '../../api/sent'
import { queryKeys } from '@/shared/lib/query-keys'
import type { SentNotificationRow } from '../../types'

const FILTER_DEFAULTS = { type: 'All', status: 'All' }

export function useSentNotifications() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
    pagination: { pageSize: 20 },
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

  const allQuery = useQuery({
    queryKey: queryKeys.notifications.sentAll(),
    queryFn: () => listSentNotifications({ page: 1, pageSize: 500 }),
  })

  const rows = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const allRows = allQuery.data?.items ?? rows

  const selection = useListSelection<SentNotificationRow>({
    items: rows,
    getId: (r) => r.id,
  })

  return {
    isLoading: query.isLoading,
    kpis: computeSentKpis(allRows),
    rows,
    total,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    search: controls.search,
    setSearch: controls.setSearch,
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    resetFilters: controls.resetAll,
    filtersActive: controls.anyActive,
    selectionMode: selection.selectionMode,
    selectedIds: selection.selectedIds,
    selectedCount: selection.selectedCount,
    allFilteredSelected: selection.allFilteredSelected,
    toggleOne: selection.toggleOne,
    toggleSelectAllFiltered: selection.toggleSelectAllFiltered,
    exitSelectionMode: selection.exitSelectionMode,
    onRowPressStart: selection.onRowPressStart,
    onRowPressEnd: selection.onRowPressEnd,
    onRowPressCancel: selection.onRowPressCancel,
    isSelected: selection.isSelected,
  }
}
