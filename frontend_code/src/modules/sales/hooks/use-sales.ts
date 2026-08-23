import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
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
import type { Lead, Client } from '../types'

export function useLeadsQuery(filters?: {
  search?: string
  status?: string
  stage?: string
  priority?: string
  source?: string
}) {
  return useQuery({
    queryKey: queryKeys.sales.leads.list(filters),
    queryFn: () => listLeads(filters),
  })
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sales.leads.detail(id as string),
    queryFn: () => getLeadById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createLead,
    onSettled: () => invalidate.salesLeads(qc),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Lead> }) => updateLead(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.sales.leads.all })
      const previousLead = qc.getQueryData<Lead>(queryKeys.sales.leads.detail(id))
      if (previousLead) {
        qc.setQueryData(queryKeys.sales.leads.detail(id), {
          ...previousLead,
          ...patch,
        })
      }
      return { previousLead }
    },
    onError: (_err, { id }, context) => {
      if (context?.previousLead) {
        qc.setQueryData(queryKeys.sales.leads.detail(id), context.previousLead)
      }
    },
    onSettled: () => invalidate.salesLeads(qc),
  })
}

export function prefetchLead(qc: ReturnType<typeof useQueryClient>, id: string) {
  if (!id) return
  return qc.prefetchQuery({
    queryKey: queryKeys.sales.leads.detail(id),
    queryFn: () => getLeadById(id),
  })
}

export function usePrefetchLead() {
  const qc = useQueryClient()
  return (id: string) => prefetchLead(qc, id)
}

export function useClientsQuery(filters?: { search?: string; status?: string; type?: string }) {
  return useQuery({
    queryKey: queryKeys.sales.clients.list(filters),
    queryFn: () => listClients(filters),
  })
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sales.clients.detail(id as string),
    queryFn: () => getClientById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClient,
    onSettled: () => invalidate.salesClients(qc),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Client> }) => updateClient(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.sales.clients.all })
      const previousClient = qc.getQueryData<Client>(queryKeys.sales.clients.detail(id))
      if (previousClient) {
        qc.setQueryData(queryKeys.sales.clients.detail(id), {
          ...previousClient,
          ...patch,
        })
      }
      return { previousClient }
    },
    onError: (_err, { id }, context) => {
      if (context?.previousClient) {
        qc.setQueryData(queryKeys.sales.clients.detail(id), context.previousClient)
      }
    },
    onSettled: () => invalidate.salesClients(qc),
  })
}

export function prefetchClient(qc: ReturnType<typeof useQueryClient>, id: string) {
  if (!id) return
  return qc.prefetchQuery({
    queryKey: queryKeys.sales.clients.detail(id),
    queryFn: () => getClientById(id),
  })
}

export function usePrefetchClient() {
  const qc = useQueryClient()
  return (id: string) => prefetchClient(qc, id)
}

/** Case studies — server returns full list; client filters via useListControls on the page/hook. */
export function useCaseStudies() {
  return useQuery({
    queryKey: queryKeys.sales.caseStudies.list(),
    queryFn: listCaseStudies,
  })
}

export function useSalesActivities() {
  return useQuery({
    queryKey: queryKeys.sales.activities(),
    queryFn: listSalesActivities,
  })
}

export function useSalesDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.sales.dashboardMetrics(),
    queryFn: getDashboardMetrics,
  })
}
