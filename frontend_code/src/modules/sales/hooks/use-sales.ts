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
import type { Lead, Client, SalesMetric } from '../types'

type LeadListData = { items: Lead[]; total: number; metrics: SalesMetric[] }
type ClientListData = { items: Client[]; total: number; metrics: SalesMetric[] }

/** Stable list key — full dataset once; filters applied client-side. */
const LEADS_LIST_KEY = queryKeys.sales.leads.list()
const CLIENTS_LIST_KEY = queryKeys.sales.clients.list()

function findLeadInCache(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
): Lead | undefined {
  const lists = qc.getQueriesData<LeadListData>({ queryKey: queryKeys.sales.leads.all })
  for (const [, data] of lists) {
    const found = data?.items?.find((l) => l.id === id)
    if (found) return found
  }
  return undefined
}

function findClientInCache(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
): Client | undefined {
  const lists = qc.getQueriesData<ClientListData>({ queryKey: queryKeys.sales.clients.all })
  for (const [, data] of lists) {
    const found = data?.items?.find((c) => c.id === id)
    if (found) return found
  }
  return undefined
}

function upsertLeadInLists(qc: ReturnType<typeof useQueryClient>, row: Lead) {
  qc.setQueriesData<LeadListData>({ queryKey: queryKeys.sales.leads.all }, (old) => {
    if (!old?.items) return old
    const exists = old.items.some((l) => l.id === row.id)
    const items = exists
      ? old.items.map((l) => (l.id === row.id ? { ...l, ...row } : l))
      : [row, ...old.items]
    return { ...old, items, total: items.length }
  })
  qc.setQueryData(queryKeys.sales.leads.detail(row.id), row)
}

function upsertClientInLists(qc: ReturnType<typeof useQueryClient>, row: Client) {
  qc.setQueriesData<ClientListData>({ queryKey: queryKeys.sales.clients.all }, (old) => {
    if (!old?.items) return old
    const exists = old.items.some((c) => c.id === row.id)
    const items = exists
      ? old.items.map((c) => (c.id === row.id ? { ...c, ...row } : c))
      : [row, ...old.items]
    return { ...old, items, total: items.length }
  })
  qc.setQueryData(queryKeys.sales.clients.detail(row.id), row)
}

/** One network call for the whole table; do not pass filters (client-side filter). */
export function useLeadsQuery(_filters?: {
  search?: string
  status?: string
  stage?: string
  priority?: string
  source?: string
}) {
  return useQuery({
    queryKey: LEADS_LIST_KEY,
    queryFn: () => listLeads(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useLead(id: string | undefined) {
  const qc = useQueryClient()
  const cached = id ? findLeadInCache(qc, id) : undefined
  return useQuery({
    queryKey: queryKeys.sales.leads.detail(id as string),
    queryFn: () => getLeadById(id!),
    enabled: Boolean(id),
    // Prefer list payload — avoid GET /leads/:id when we already have the row
    initialData: cached,
    staleTime: cached ? 60_000 : 0,
    refetchOnWindowFocus: false,
  })
}

/**
 * Cache strategy: upsert on success only (no onSettled invalidate).
 * Invalidation after upsert races and can overwrite the optimistic/server row.
 */
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
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Lead> }) => updateLead(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.sales.leads.all })
      const previousLead = qc.getQueryData<Lead>(queryKeys.sales.leads.detail(id))
      const optimistic = previousLead ? { ...previousLead, ...patch, id } : ({ id, ...patch } as Lead)
      if (previousLead) {
        qc.setQueryData(queryKeys.sales.leads.detail(id), optimistic)
      }
      upsertLeadInLists(qc, optimistic)
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

/** One network call for the whole clients table. */
export function useClientsQuery(_filters?: { search?: string; status?: string; type?: string }) {
  return useQuery({
    queryKey: CLIENTS_LIST_KEY,
    queryFn: () => listClients(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useClient(id: string | undefined) {
  const qc = useQueryClient()
  const cached = id ? findClientInCache(qc, id) : undefined
  return useQuery({
    queryKey: queryKeys.sales.clients.detail(id as string),
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
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Client> }) => updateClient(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.sales.clients.all })
      const previousClient = qc.getQueryData<Client>(queryKeys.sales.clients.detail(id))
      const optimistic = previousClient
        ? { ...previousClient, ...patch, id }
        : ({ id, ...patch } as Client)
      if (previousClient) {
        qc.setQueryData(queryKeys.sales.clients.detail(id), optimistic)
      }
      upsertClientInLists(qc, optimistic)
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

export function useCaseStudies() {
  return useQuery({
    queryKey: queryKeys.sales.caseStudies.list(),
    queryFn: listCaseStudies,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
