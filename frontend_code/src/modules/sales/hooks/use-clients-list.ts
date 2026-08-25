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

  const { data, isLoading, isError, refetch, isFetching } = useClientsQuery()

  const allItems = data?.items ?? []
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])

  const filtered = useMemo(() => {
    const q = controls.debouncedSearch.trim().toLowerCase()
    const { status, type } = controls.filters
    return allItems.filter((c) => {
      if (q) {
        const hay =
          `${c.name} ${c.industry} ${c.id} ${c.primaryContact ?? ''} ${c.country}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (status !== 'All' && c.status !== status) return false
      if (type !== 'All' && c.type !== type) return false
      return true
    })
  }, [allItems, controls.debouncedSearch, controls.filters])

  const selection = useListSelection({
    items: filtered,
    getId: (c) => c.id,
  })

  const pageItems = useMemo(() => controls.pageItems(filtered), [controls, filtered])

  const startLongPress = (id: string) => selection.onRowPressStart(id)
  const endLongPress = (client: Client, onShortPress?: (c: Client) => void) => {
    selection.onRowPressEnd(client.id, () => onShortPress?.(client))
  }

  return {
    metrics,
    totalCount: allItems.length,
    filtered,
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
    statuses: filterOptionsQuery.data?.statuses ?? [],
    types: filterOptionsQuery.data?.types ?? [],
    industries: filterOptionsQuery.data?.industries ?? [],
    countries: filterOptionsQuery.data?.countries ?? [],
    resetFilters: controls.resetAll,
    filtersActive: controls.anyActive,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    pageItems,
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
