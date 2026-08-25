import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { getLeadFilterOptions } from '../api/sales'
import { useLeadsQuery } from './use-sales'
import type { Lead } from '../types'

const FILTER_DEFAULTS = {
  status: 'All',
  stage: 'All',
  priority: 'All',
  source: 'All',
}

export function useLeadsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  /** Filter options: once per session while mounted cache lives */
  const filterOptionsQuery = useQuery({
    queryKey: queryKeys.sales.leads.filterOptions(),
    queryFn: getLeadFilterOptions,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  /** Single list call — no filter params (avoids refetch on every filter change) */
  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery()

  const allItems = data?.items ?? []
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])

  const filtered = useMemo(() => {
    const q = controls.debouncedSearch.trim().toLowerCase()
    const { status, stage, priority, source } = controls.filters
    return allItems.filter((l) => {
      if (q) {
        const hay = `${l.contactName} ${l.title} ${l.id} ${l.company} ${l.email ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (status !== 'All' && l.status !== status) return false
      if (stage !== 'All' && l.stage !== stage) return false
      if (priority !== 'All' && l.priority !== priority) return false
      if (source !== 'All' && l.source !== source) return false
      return true
    })
  }, [allItems, controls.debouncedSearch, controls.filters])

  const selection = useListSelection({
    items: filtered,
    getId: (l) => l.id,
  })

  const pageItems = useMemo(() => controls.pageItems(filtered), [controls, filtered])

  const startLongPress = (id: string) => selection.onRowPressStart(id)
  const endLongPress = (lead: Lead, onShortPress?: (l: Lead) => void) => {
    selection.onRowPressEnd(lead.id, () => onShortPress?.(lead))
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
    stageFilter: controls.filters.stage,
    setStageFilter: (v: string) => controls.setFilter('stage', v),
    priorityFilter: controls.filters.priority,
    setPriorityFilter: (v: string) => controls.setFilter('priority', v),
    sourceFilter: controls.filters.source,
    setSourceFilter: (v: string) => controls.setFilter('source', v),
    stages: filterOptionsQuery.data?.stages ?? [],
    priorities: filterOptionsQuery.data?.priorities ?? [],
    sources: filterOptionsQuery.data?.sources ?? [],
    statuses: filterOptionsQuery.data?.statuses ?? [],
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
