/**
 * Client domain API — list/detail/create/update + filter options.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import { clients as seedClients, clientMetrics } from '../data/mock'
import type {
  Client,
  SalesMetric,
  CreateClientInput,
  ClientFilterOptions,
} from '../types'

let clientsStore: Client[] | null = null

function clients(): Client[] {
  if (!clientsStore) clientsStore = seedClients.map((c) => ({ ...c }))
  return clientsStore
}

export async function getClientFilterOptions(): Promise<ClientFilterOptions> {
  if (env.useMockApi) {
    await delay()
    const items = clients()
    const uniq = (vals: string[]) => Array.from(new Set(vals.filter(Boolean))).sort()
    return {
      statuses: uniq([...items.map((c) => c.status), 'Active', 'Inactive']),
      types: uniq([...items.map((c) => c.type), 'Enterprise', 'SMB', 'Partner']),
      industries: uniq(items.map((c) => c.industry)),
      countries: uniq(items.map((c) => c.country)),
    }
  }
  try {
    const { data } = await apiClient.get<ClientFilterOptions>('/sales/meta/client-filter-options')
    return data
  } catch {
    const { data } = await apiClient.get<ClientFilterOptions>('/sales/clients/filter-options')
    return data
  }
}

export async function listClients(params?: {
  search?: string
  status?: string
  type?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Client[]; total: number; metrics: SalesMetric[] }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: Client[]; total: number; metrics: SalesMetric[] }>(
      '/sales/clients',
      { params },
    )
    if (Array.isArray(data)) {
      return { items: data as unknown as Client[], total: data.length, metrics: [] }
    }
    return data
  }
  await delay()
  let items = [...clients()]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        (c.primaryContact?.toLowerCase().includes(q) ?? false) ||
        c.id.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') items = items.filter((c) => c.status === params.status)
  if (params?.type && params.type !== 'All') items = items.filter((c) => c.type === params.type)
  if (params?.page != null || params?.pageSize != null) {
    const page = paginateItems(items, params.page, params.pageSize)
    return { items: page.items, total: page.total, metrics: clientMetrics }
  }
  return { items, total: items.length, metrics: clientMetrics }
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<Client & { detail?: string }>(`/sales/clients/${id}`)
      if ((data as { detail?: string }).detail) return null
      return data
    } catch {
      return null
    }
  }
  await delay()
  return clients().find((c) => c.id === id) ?? null
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Client>('/sales/clients', input)
    return data
  }
  await delay(400)
  const list = clients()
  const row: Client = {
    id: `c${list.length + 1}`,
    name: input.name,
    legalName: input.legalName,
    type: input.type ?? 'SMB',
    status: input.status ?? 'Active',
    industry: input.industry ?? '—',
    website: input.website,
    country: input.country ?? '—',
    address: input.address,
    taxId: input.taxId,
    founded: input.founded,
    chatLink: input.chatLink,
    primaryContact: input.primaryContact,
    email: input.email,
    phone: input.phone,
    projects: 0,
    leads: 0,
    logoInitials: input.name.slice(0, 2).toUpperCase(),
    clientSince: new Date().toISOString().slice(0, 10),
  }
  list.unshift(row)
  return row
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<Client>(`/sales/clients/${id}`, patch)
    return data
  }
  await delay(350)
  const list = clients()
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0) throw new Error('Client not found')
  list[idx] = { ...list[idx], ...patch, id }
  return list[idx]
}
