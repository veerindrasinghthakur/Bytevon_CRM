import { useMemo, useState } from 'react'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useLeadsQuery } from './use-sales'
import type { Lead, PipelineStage, LeadPriority } from '../types'

export function useLeadsList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [stageFilter, setStageFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [quickView, setQuickView] = useState<Lead | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery({
    search: search || undefined,
    status: statusFilter,
    stage: stageFilter,
    priority: priorityFilter,
    source: sourceFilter,
  })

  const filtered = data?.items ?? []
  const metrics = data?.metrics ?? []
  const totalCount = data?.total ?? 0

  const selection = useListSelection({
    items: filtered,
    getId: (l) => l.id,
  })

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setStageFilter('All')
    setPriorityFilter('All')
    setSourceFilter('All')
  }

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
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    priorityFilter,
    setPriorityFilter,
    sourceFilter,
    setSourceFilter,
    stages,
    priorities,
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
    clearLongPress: selection.onRowPressCancel,
    selection,
  }
}
