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

  const filterOptionsQuery = useQuery({
    queryKey: queryKeys.sales.leads.filterOptions(),
    queryFn: getLeadFilterOptions,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  /** Server-side filter + page — API receives page/pageSize/search/filters */
  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery({
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status,
    stage: controls.filters.stage,
    priority: controls.filters.priority,
    source: controls.filters.source,
    page: controls.page,
    pageSize: controls.pageSize,
  })

  const pageItems = data?.items ?? []
  const totalCount = data?.total ?? 0
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])

  const selection = useListSelection({
    items: pageItems,
    getId: (l) => l.id,
  })

  const startLongPress = (id: string) => selection.onRowPressStart(id)
  const endLongPress = (lead: Lead, onShortPress?: (l: Lead) => void) => {
    selection.onRowPressEnd(lead.id, () => onShortPress?.(lead))
  }

  return {
    metrics,
    totalCount,
    /** Current page rows (server-paginated) */
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
