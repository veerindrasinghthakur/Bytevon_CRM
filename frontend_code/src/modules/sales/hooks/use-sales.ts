import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    queryKey: ['sales', 'leads', filters ?? {}],
    queryFn: () => listLeads(filters),
  })
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['sales', 'leads', 'detail', id],
    queryFn: () => getLeadById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createLead,
    onSettled: () => void qc.invalidateQueries({ queryKey: ['sales', 'leads'] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Lead> }) => updateLead(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(['sales', 'leads', 'detail', row.id], row)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['sales', 'leads'] }),
  })
}

export function useClientsQuery(filters?: { search?: string; status?: string; type?: string }) {
  return useQuery({
    queryKey: ['sales', 'clients', filters ?? {}],
    queryFn: () => listClients(filters),
  })
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['sales', 'clients', 'detail', id],
    queryFn: () => getClientById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClient,
    onSettled: () => void qc.invalidateQueries({ queryKey: ['sales', 'clients'] }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Client> }) => updateClient(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(['sales', 'clients', 'detail', row.id], row)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['sales', 'clients'] }),
  })
}

export function useCaseStudies() {
  return useQuery({
    queryKey: ['sales', 'case-studies'],
    queryFn: listCaseStudies,
  })
}

export function useSalesActivities() {
  return useQuery({
    queryKey: ['sales', 'activities'],
    queryFn: listSalesActivities,
  })
}

export function useSalesDashboardMetrics() {
  return useQuery({
    queryKey: ['sales', 'dashboard-metrics'],
    queryFn: getDashboardMetrics,
  })
}
