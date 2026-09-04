import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  listClients,
  getClientById,
  createClient,
  updateClient,
  listCaseStudies,
  listSalesActivities,
  getDashboardMetrics,
} from '../api/sales'
import type {
  Lead,
  Client,
  LeadListParams,
  ClientListParams,
  CaseStudyListParams,
} from '../types'
import {
  findLeadInCache,
  findClientInCache,
  upsertLeadInLists,
  upsertClientInLists,
  mergeLead,
  mergeClient,
} from './sales-cache'

/** Server-side filters + pagination; query key includes params. */
export function useLeadsQuery(filters?: LeadListParams) {
  const params: LeadListParams = {
    search: filters?.search || undefined,
    status: filters?.status && filters.status !== 'All' ? filters.status : undefined,
    stage: filters?.stage && filters.stage !== 'All' ? filters.stage : undefined,
    priority: filters?.priority && filters.priority !== 'All' ? filters.priority : undefined,
    source: filters?.source && filters.source !== 'All' ? filters.source : undefined,
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

/** @deprecated Prefer useCaseStudiesQuery with filters */
export function useCaseStudies() {
  return useQuery({
    queryKey: queryKeys.sales.caseStudies.list({}),
    queryFn: () => listCaseStudies(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useCaseStudiesQuery(filters?: CaseStudyListParams) {
  const params: CaseStudyListParams = {
    search: filters?.search || undefined,
    status: filters?.status && filters.status !== 'All' ? filters.status : undefined,
    page: filters?.page,
    pageSize: filters?.pageSize,
  }
  return useQuery({
    queryKey: queryKeys.sales.caseStudies.list(params),
    queryFn: () => listCaseStudies(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })
}

export function useSalesActivities() {
  return useQuery({
    queryKey: queryKeys.sales.activities(),
    queryFn: listSalesActivities,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useSalesDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.sales.dashboardMetrics(),
    queryFn: getDashboardMetrics,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
