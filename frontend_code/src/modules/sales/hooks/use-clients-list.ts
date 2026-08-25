import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { getClientFilterOptions } from '../api/sales'
import { useClientsQuery } from './use-sales'
import type { Client } from '../types'

const FILTER_DEFAULTS = {
  status: 'All',
  type: 'All',
}

export function useClientsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const filterOptionsQuery = useQuery({
    queryKey: queryKeys.sales.clients.filterOptions(),
    queryFn: getClientFilterOptions,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const { data, isLoading, isError, refetch, isFetching } = useClientsQuery({
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status,
    type: controls.filters.type,
    page: controls.page,
    pageSize: controls.pageSize,
  })

  const pageItems = data?.items ?? []
  const totalCount = data?.total ?? 0
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])

  const selection = useListSelection({
    items: pageItems,
    getId: (c) => c.id,
  })

  const startLongPress = (id: string) => selection.onRowPressStart(id)
  const endLongPress = (client: Client, onShortPress?: (c: Client) => void) => {
    selection.onRowPressEnd(client.id, () => onShortPress?.(client))
  }

  return {
    metrics,
    totalCount,
    filtered: pageItems,
    pageItems,
    isLoading: isLoading || filterOptionsQuery.isLoading,
    isError,
    refetch,
    isFetching,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
    types: filterOptionsQuery.data?.types ?? [],
    statuses: filterOptionsQuery.data?.statuses ?? [],
    industries: filterOptionsQuery.data?.industries ?? [],
    countries: filterOptionsQuery.data?.countries ?? [],
    resetFilters: controls.resetAll,
    filtersActive: controls.anyActive,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    selectionMode: selection.selectionMode,
    selectedIds: selection.selectedIds,
    allFilteredSelected: selection.allFilteredSelected,
    toggleOne: selection.toggleOne,
    toggleSelectAllFiltered: selection.toggleSelectAllFiltered,
    exitSelectionMode: selection.exitSelectionMode,
    startLongPress,
    endLongPress,
    clearLongPress: selection.onRowPressCancel,
    selection,
  }
}
