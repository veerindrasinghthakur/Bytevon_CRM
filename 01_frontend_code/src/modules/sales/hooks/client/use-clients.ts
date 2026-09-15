import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  getClientFilterOptions,
} from '../../api/client'
import type { Client, ClientListParams } from '../../types'
import {
  findClientInCache,
  upsertClientInLists,
  mergeClient,
} from '../sales-cache'

export function useClientsQuery(filters?: ClientListParams) {
  const params: ClientListParams = {
    search: filters?.search || undefined,
    status: filters?.status && filters.status !== 'All' ? filters.status : undefined,
    type: filters?.type && filters.type !== 'All' ? filters.type : undefined,
    page: filters?.page,
    pageSize: filters?.pageSize,
  }
  return useQuery({
    queryKey: queryKeys.sales.clients.list(params),
    queryFn: () => listClients(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })
}

export function useClient(id: string | undefined) {
  const qc = useQueryClient()
  const cached = id ? findClientInCache(qc, id) : undefined
  return useQuery({
    queryKey: queryKeys.sales.clients.detail(id ?? ''),
    queryFn: () => getClientById(id!),
    enabled: Boolean(id),
    initialData: cached,
    staleTime: cached ? 60_000 : 0,
    refetchOnWindowFocus: false,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClient,
    onSuccess: (row) => {
      upsertClientInLists(qc, row)
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation<
    Client,
    Error,
    { id: string; patch: Partial<Client> },
    { previousClient?: Client }
  >({
    mutationFn: ({ id, patch }) => updateClient(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.sales.clients.all })
      const previousClient = findClientInCache(qc, id)
      if (previousClient) {
        const optimistic = mergeClient(previousClient, patch, id)
        qc.setQueryData(queryKeys.sales.clients.detail(id), optimistic)
        upsertClientInLists(qc, optimistic)
      }
      return { previousClient }
    },
    onError: (_err, { id }, context) => {
      if (context?.previousClient) {
        qc.setQueryData(queryKeys.sales.clients.detail(id), context.previousClient)
        upsertClientInLists(qc, context.previousClient)
      }
    },
    onSuccess: (row) => {
      upsertClientInLists(qc, row)
    },
  })
}

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
