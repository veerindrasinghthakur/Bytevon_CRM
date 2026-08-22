import { useMemo, useState } from 'react'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useClientsQuery } from './use-sales'
import type { Client } from '../types'

export function useClientsList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [quickView, setQuickView] = useState<Client | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useClientsQuery({
    search: search || undefined,
    status: statusFilter,
    type: typeFilter,
  })

  const filtered = data?.items ?? []
  const metrics = data?.metrics ?? []
  const totalCount = data?.total ?? 0

  const selection = useListSelection({
    items: filtered,
    getId: (c) => c.id,
  })

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setTypeFilter('All')
  }

  /** Bridge long-press / short-press to selection + quick view (same UX as before). */
  const startLongPress = (id: string) => selection.onRowPressStart(id)
  const endLongPress = (client: Client) => {
    selection.onRowPressEnd(client.id, () => setQuickView(client))
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
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    resetFilters,
    quickView,
    setQuickView,
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
