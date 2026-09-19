import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  getLeadFilterOptions,
} from '../../api/lead'
import type { Lead, LeadListParams } from '../../types'
import {
  findLeadInCache,
  upsertLeadInLists,
  mergeLead,
} from '../sales-cache'

/** Server-side filters + pagination; query key includes params. */
export function useLeadsQuery(filters?: LeadListParams) {
  const params: LeadListParams = {
    search: filters?.search || undefined,
    status: filters?.status && filters.status !== 'All' ? filters.status : undefined,
    stage: filters?.stage && filters.stage !== 'All' ? filters.stage : undefined,
    priority: filters?.priority && filters.priority !== 'All' ? filters.priority : undefined,
    source: filters?.source && filters.source !== 'All' ? filters.source : undefined,
    dateFrom: filters?.dateFrom || undefined,
    dateTo: filters?.dateTo || undefined,
    page: filters?.page,
    pageSize: filters?.pageSize,
  }
  return useQuery({
    queryKey: queryKeys.sales.leads.list(params),
    queryFn: () => listLeads(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })
}

export function useLead(id: string | undefined) {
  const qc = useQueryClient()
  const cached = id ? findLeadInCache(qc, id) : undefined
  return useQuery({
    queryKey: queryKeys.sales.leads.detail(id ?? ''),
    queryFn: () => getLeadById(id!),
    enabled: Boolean(id),
    initialData: cached,
    staleTime: cached ? 60_000 : 0,
    refetchOnWindowFocus: false,
  })
}

/** Cache strategy: upsert on success only (no onSettled invalidate). */
export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createLead,
    onSuccess: (row) => {
      upsertLeadInLists(qc, row)
    },
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation<
    Lead,
    Error,
    { id: string; patch: Partial<Lead> },
    { previousLead?: Lead }
  >({
    mutationFn: ({ id, patch }) => updateLead(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.sales.leads.all })
      const previousLead = findLeadInCache(qc, id)
      if (previousLead) {
        const optimistic = mergeLead(previousLead, patch, id)
        qc.setQueryData(queryKeys.sales.leads.detail(id), optimistic)
        upsertLeadInLists(qc, optimistic)
      }
      return { previousLead }
    },
    onError: (_err, { id }, context) => {
      if (context?.previousLead) {
        qc.setQueryData(queryKeys.sales.leads.detail(id), context.previousLead)
        upsertLeadInLists(qc, context.previousLead)
      }
    },
    onSuccess: (row) => {
      upsertLeadInLists(qc, row)
    },
  })
}

const FILTER_DEFAULTS = {
  status: 'All',
  stage: 'All',
  priority: 'All',
  source: 'All',
  dateFrom: '',
  dateTo: '',
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
    dateFilter: controls.filters.dateFrom ? { from: controls.filters.dateFrom, to: controls.filters.dateTo } : undefined,
    setDateFilter: (v: { from: string; to: string }) => {
      controls.setFilter('dateFrom', v.from)
      controls.setFilter('dateTo', v.to)
    },
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
