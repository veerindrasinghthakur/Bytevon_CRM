import { useMemo } from 'react'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
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

  const { data, isLoading, isError, refetch, isFetching } = useClientsQuery({
    search: controls.debouncedSearch || undefined,
    status: controls.filters.status,
    type: controls.filters.type,
  })

  const filtered = useMemo(() => data?.items ?? [], [data?.items])
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])
  const totalCount = data?.total ?? 0

  const selection = useListSelection({
    items: filtered,
    getId: (c) => c.id,
  })

  const pageItems = useMemo(() => controls.pageItems(filtered), [controls, filtered])

  const startLongPress = (id: string) => selection.onRowPressStart(id)
  /** Short press runs onShortPress (e.g. open shared QuickOverview) */
  const endLongPress = (client: Client, onShortPress?: (c: Client) => void) => {
    selection.onRowPressEnd(client.id, () => onShortPress?.(client))
  }
  const clearLongPress = selection.onRowPressCancel

  return {
    metrics,
    totalCount,
    filtered,
    isLoading,
    isError,
    refetch,
    isFetching,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
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
    clearLongPress,
    selection,
  }
}
