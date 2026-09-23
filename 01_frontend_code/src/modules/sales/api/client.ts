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

function mapApiClient(row: Record<string, unknown>): Client {
  const id = String(row.id ?? '')
  const name = String(row.name ?? row.client_name ?? row.company_name ?? '—')
  const initials =
    String(row.logoInitials ?? row.logo_initials ?? '').trim() ||
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    '—'
  const statusRaw = String(row.status ?? 'Active')
  const status: Client['status'] =
    statusRaw.toUpperCase() === 'INACTIVE' || statusRaw === 'Inactive' ? 'Inactive' : 'Active'
  const typeRaw = String(row.type ?? row.client_type ?? 'SMB')
  const type = (['Enterprise', 'SMB', 'Partner', 'Individual'].includes(typeRaw)
    ? typeRaw
    : 'SMB') as Client['type']
  return {
    id: id.startsWith('c') || id.startsWith('C') ? id : `c${id}`,
    name,
    legalName: (row.legalName as string | undefined) ?? (row.legal_name as string | undefined),
    type,
    status,
    industry: String(row.industry ?? '—'),
    website: (row.website as string | undefined) ?? undefined,
    country: String(row.country ?? '—'),
    state: (row.state as string | undefined) ?? undefined,
    city: (row.city as string | undefined) ?? undefined,
    address: (row.address as string | undefined) ?? undefined,
    taxId: (row.taxId as string | undefined) ?? (row.tax_id as string | undefined),
    founded: (row.founded as string | undefined) ?? undefined,
    chatLink: (row.chatLink as string | undefined) ?? (row.chat_link as string | undefined),
    primaryContact:
      (row.primaryContact as string | undefined) ??
      (row.primary_contact as string | undefined) ??
      undefined,
    email: (row.email as string | undefined) ?? undefined,
    phone: (row.phone as string | undefined) ?? undefined,
    projects: Number(row.projects ?? 0),
    leads: Number(row.leads ?? 0),
    logoInitials: initials,
    clientSince: String(row.clientSince ?? row.client_since ?? row.created_at ?? '').slice(0, 10) || undefined,
  }
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
    const { data } = await apiClient.get<
      | Client[]
      | Array<Record<string, unknown>>
      | { items: Array<Record<string, unknown>>; total: number; metrics?: SalesMetric[] }
    >('/sales/clients', { params })
    const raw = Array.isArray(data) ? data : (data.items ?? [])
    const items = raw.map((r) => mapApiClient(r as Record<string, unknown>))
    const total = Array.isArray(data) ? items.length : Number(data.total ?? items.length)
    const metrics = Array.isArray(data) ? [] : (data.metrics ?? [])
    return { items, total, metrics }
  }
  await delay()
  let items = [...clients()]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (c) =>
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q) ||
        (c.primaryContact?.toLowerCase().includes(q) ?? false) ||
        (c.id ?? '').toLowerCase().includes(q),
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
      const numeric = id.replace(/^c/i, '')
      const { data } = await apiClient.get<Record<string, unknown>>(`/sales/clients/${numeric}`)
      if ((data as { detail?: string }).detail) return null
      return mapApiClient(data)
    } catch {
      return null
    }
  }
  await delay()
  return clients().find((c) => c.id === id) ?? null
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Record<string, unknown>>(
      '/sales/clients',
      toBackendClient(input),
    )
    const numeric = String((data as { id?: unknown }).id ?? '')
    if (input.status === 'Inactive' && numeric) {
      try {
        await apiClient.post(`/sales/clients/${numeric}/archive`)
      } catch {
        // Status is display-only; the client itself was created.
      }
    }
    return mapApiClient(data)
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
    logoInitials: (input.name ?? '—').slice(0, 2).toUpperCase(),
    clientSince: new Date().toISOString().slice(0, 10),
  }
  list.unshift(row)
  return row
}

/**
 * UI Client → backend ClientCreate/ClientUpdate (snake_case, backend enum).
 * UI-only fields (status display, primaryContact/email/phone, counters) are
 * dropped here; contacts are posted separately via addClientContact.
 */
function toBackendClient(patch: Partial<Client>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (patch.name != null) body.client_name = patch.name
  if (patch.type != null) {
    body.client_type = patch.type === 'Individual' ? 'INDIVIDUAL' : 'COMPANY'
  }
  for (const key of [
    'website',
    'industry',
    'country',
    'state',
    'city',
    'address',
  ] as const) {
    if (patch[key] != null) body[key] = patch[key]
  }
  if (patch.legalName !== undefined) body.legal_name = patch.legalName || null
  if (patch.taxId !== undefined) body.tax_id = patch.taxId || null
  if (patch.founded !== undefined) body.founded = patch.founded || null
  if (patch.chatLink !== undefined) body.chat_link = patch.chatLink || null
  return body
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  if (!env.useMockApi) {
    const numeric = id.replace(/^c/i, '')
    const { data } = await apiClient.patch<Record<string, unknown>>(
      `/sales/clients/${numeric}`,
      toBackendClient(patch),
    )
    if (patch.status === 'Inactive') {
      try {
        await apiClient.post(`/sales/clients/${numeric}/archive`)
      } catch {
        // Status is display-only; scalar fields were saved.
      }
    }
    return mapApiClient(data)
  }
  await delay(350)
  const list = clients()
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0) throw new Error('Client not found')
  list[idx] = { ...list[idx], ...patch, id }
  return list[idx]
}

export interface ClientContactInput {
  name: string
  designation?: string
  email?: string
  phone?: string
}

export async function archiveClient(clientId: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const list = clients()
    const idx = list.findIndex((c) => c.id === clientId)
    if (idx >= 0) list[idx] = { ...list[idx], status: 'Inactive' }
    return
  }
  const numeric = clientId.replace(/^c/i, '')
  await apiClient.post(`/sales/clients/${numeric}/archive`)
}

export async function listClientContacts(clientId: string): Promise<ClientContactInput[]> {
  if (env.useMockApi) return []
  const numeric = clientId.replace(/^c/i, '')
  const { data } = await apiClient.get<Array<Record<string, unknown>>>(
    `/sales/clients/${numeric}/contacts`,
  )
  return (Array.isArray(data) ? data : []).map((c) => ({
    name: String(c.name ?? ''),
    designation: (c.designation as string | undefined) ?? undefined,
    email: (c.email as string | undefined) ?? undefined,
    phone: (c.phone as string | undefined) ?? undefined,
  }))
}

export async function addClientContact(
  clientId: string,
  contact: ClientContactInput,
): Promise<void> {
  if (env.useMockApi) return
  const numeric = clientId.replace(/^c/i, '')
  await apiClient.post(`/sales/clients/${numeric}/contacts`, {
    client_id: Number(numeric),
    name: contact.name,
    designation: contact.designation || null,
    email: contact.email || null,
    phone: contact.phone || null,
  })
}
