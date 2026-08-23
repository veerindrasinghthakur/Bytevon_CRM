import { useState } from 'react'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { useLeadsQuery } from './use-sales'
import type { Lead, PipelineStage, LeadPriority } from '../types'

const FILTER_DEFAULTS = {
  status: 'All',
  stage: 'All',
  priority: 'All',
  source: 'All',
}

export function useLeadsList() {
  const [quickView, setQuickView] = useState<Lead | null>(null)

  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery({
    search: controls.search || undefined,
    status: controls.filters.status,
    stage: controls.filters.stage,
    priority: controls.filters.priority,
    source: controls.filters.source,
  })

  const filtered = data?.items ?? []
  const metrics = data?.metrics ?? []
  const totalCount = data?.total ?? 0

  const selection = useListSelection({
    items: filtered,
    getId: (l) => l.id,
  })

  const startLongPress = (id: string) => selection.onRowPressStart(id)
  const endLongPress = (lead: Lead) => {
    selection.onRowPressEnd(lead.id, () => setQuickView(lead))
  }

  const stages: PipelineStage[] = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost',
  ]
  const priorities: LeadPriority[] = ['Critical', 'High', 'Medium', 'Low']

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
    stageFilter: controls.filters.stage,
    setStageFilter: (v: string) => controls.setFilter('stage', v),
    priorityFilter: controls.filters.priority,
    setPriorityFilter: (v: string) => controls.setFilter('priority', v),
    sourceFilter: controls.filters.source,
    setSourceFilter: (v: string) => controls.setFilter('source', v),
    stages,
    priorities,
    resetFilters: controls.resetAll,
    filtersActive: controls.anyActive,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    pageItems: controls.pageItems(filtered),
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
    clearLongPress: selection.onRowPressCancel,
    selection,
  }
}
