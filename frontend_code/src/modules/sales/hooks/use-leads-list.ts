import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
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
    queryKey: ['sales', 'leads', 'filter-options'],
    queryFn: getLeadFilterOptions,
    staleTime: 60_000,
  })

  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery({
    search: controls.debouncedSearch || undefined,
    status: controls.filters.status,
    stage: controls.filters.stage,
    priority: controls.filters.priority,
    source: controls.filters.source,
  })

  const filtered = useMemo(() => data?.items ?? [], [data?.items])
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])
  const totalCount = data?.total ?? 0

  const selection = useListSelection({
    items: filtered,
    getId: (l) => l.id,
  })

  const pageItems = useMemo(() => controls.pageItems(filtered), [controls, filtered])

  const startLongPress = (id: string) => selection.onRowPressStart(id)
  const endLongPress = (lead: Lead, onShortPress?: (l: Lead) => void) => {
    selection.onRowPressEnd(lead.id, () => onShortPress?.(lead))
  }

  const stages = filterOptionsQuery.data?.stages ?? []
  const priorities = filterOptionsQuery.data?.priorities ?? []
  const sources = filterOptionsQuery.data?.sources ?? []
  const statuses = filterOptionsQuery.data?.statuses ?? []

  return {
    metrics,
    totalCount,
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
    stages,
    priorities,
    sources,
    statuses,
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
