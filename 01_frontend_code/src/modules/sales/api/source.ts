/**
 * Lead sources (platforms table) API.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'

export type LeadSource = {
  id: number
  name: string
  description: string | null
  isArchived: boolean
  leadCount: number
  status: string
  createdAt?: string | null
  updatedAt?: string | null
}

export type SourceMetric = {
  id: string
  label: string
  value: string
  icon?: string
}

export type SourcesListResult = {
  items: LeadSource[]
  total: number
  metrics: SourceMetric[]
}

let mockSources: LeadSource[] = [
  { id: 1, name: 'LinkedIn', description: null, isArchived: false, leadCount: 12, status: 'Active' },
  { id: 2, name: 'Website', description: 'Organic form', isArchived: false, leadCount: 28, status: 'Active' },
  { id: 3, name: 'Referral', description: null, isArchived: false, leadCount: 9, status: 'Active' },
]

function mapRow(r: Record<string, unknown>): LeadSource {
  const isArchived = Boolean(r.is_archived ?? r.isArchived)
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    description: (r.description as string | null) ?? null,
    isArchived,
    leadCount: Number(r.leadCount ?? r.lead_count ?? 0),
    status: String(r.status ?? (isArchived ? 'Archived' : 'Active')),
    createdAt: (r.created_at as string) ?? null,
    updatedAt: (r.updated_at as string) ?? null,
  }
}

function toMetricCards(
  items: LeadSource[],
  backend?: { total?: number; active?: number; archived?: number },
): SourceMetric[] {
  const active = items.filter((s) => !s.isArchived)
  const top = active.reduce<LeadSource | null>(
    (best, s) => (!best || s.leadCount > best.leadCount ? s : best),
    null,
  )
  return [
    {
      id: 'total',
      label: 'Total sources',
      value: String(backend?.active ?? active.length),
      icon: 'hub',
    },
    {
      id: 'top',
      label: 'Source with highest leads',
      value: top && top.leadCount > 0 ? `${top.name} (${top.leadCount})` : '—',
      icon: 'emoji_events',
    },
    {
      id: 'leads',
      label: 'Leads with source',
      value: String(items.reduce((a, s) => a + s.leadCount, 0)),
      icon: 'person_search',
    },
    {
      id: 'deleted',
      label: 'Deleted sources',
      value: String(backend?.archived ?? mockSources.filter((s) => s.isArchived).length),
      icon: 'delete',
    },
  ]
}

export async function listSources(opts?: {
  includeArchived?: boolean
}): Promise<SourcesListResult> {
  if (env.useMockApi) {
    await delay()
    const items = mockSources.filter((s) => opts?.includeArchived || !s.isArchived)
    const active = items.filter((s) => !s.isArchived)
    const top = active.reduce<
      LeadSource | null
    >((best, s) => (!best || s.leadCount > best.leadCount ? s : best), null)
    return {
      items,
      total: items.length,
      metrics: [
        { id: 'total', label: 'Total sources', value: String(active.length), icon: 'hub' },
        {
          id: 'top',
          label: 'Source with highest leads',
          value: top && top.leadCount > 0 ? `${top.name} (${top.leadCount})` : '—',
          icon: 'emoji_events',
        },
        {
          id: 'leads',
          label: 'Leads with source',
          value: String(items.reduce((a, s) => a + s.leadCount, 0)),
          icon: 'person_search',
        },
        {
          id: 'archived',
          label: 'Archived sources',
          value: String(mockSources.filter((s) => s.isArchived).length),
          icon: 'inventory_2',
        },
      ],
    }
  }

  const { data } = await apiClient.get<Record<string, unknown> | unknown[]>('/sales/sources', {
    params: {
      include_archived: opts?.includeArchived ?? false,
      with_stats: true,
    },
  })

  if (Array.isArray(data)) {
    const items = data.map((r) => mapRow(r as Record<string, unknown>))
    return { items, total: items.length, metrics: toMetricCards(items) }
  }

  const payload = data as {
    items?: Record<string, unknown>[]
    total?: number
    metrics?: { total?: number; active?: number; archived?: number } | SourceMetric[]
  }
  const items = (payload.items ?? []).map(mapRow)
  const backendMetrics = Array.isArray(payload.metrics) ? undefined : payload.metrics
  return {
    items,
    total: payload.total ?? items.length,
    metrics: toMetricCards(items, backendMetrics),
  }
}

export async function createSource(input: {
  name: string
  description?: string | null
}): Promise<LeadSource> {
  if (env.useMockApi) {
    await delay(300)
    const row: LeadSource = {
      id: Math.max(0, ...mockSources.map((s) => s.id)) + 1,
      name: input.name,
      description: input.description ?? null,
      isArchived: false,
      leadCount: 0,
      status: 'Active',
    }
    mockSources = [row, ...mockSources]
    return row
  }
  const { data } = await apiClient.post<Record<string, unknown>>('/sales/sources', {
    name: input.name,
    description: input.description ?? null,
  })
  return mapRow(data)
}

export async function updateSource(
  id: number,
  input: { name?: string; description?: string | null },
): Promise<LeadSource> {
  if (env.useMockApi) {
    await delay(300)
    const idx = mockSources.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('Source not found')
    mockSources[idx] = {
      ...mockSources[idx],
      name: input.name ?? mockSources[idx].name,
      description: input.description !== undefined ? input.description : mockSources[idx].description,
    }
    return mockSources[idx]
  }
  const { data } = await apiClient.patch<Record<string, unknown>>(`/sales/sources/${id}`, input)
  return mapRow(data)
}

export async function getSource(
  id: number,
  opts?: { includeArchived?: boolean },
): Promise<LeadSource | null> {
  if (env.useMockApi) {
    await delay()
    const row = mockSources.find((s) => s.id === id)
    if (!row) return null
    if (row.isArchived && !opts?.includeArchived) return null
    return { ...row }
  }
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`/sales/sources/${id}`, {
      params: opts?.includeArchived ? { include_archived: true } : undefined,
    })
    return mapRow(data ?? {})
  } catch (err) {
    // Archived rows 404 by default — retry with include_archived before giving up.
    if (!opts?.includeArchived && isNotFound(err)) {
      const { data } = await apiClient.get<Record<string, unknown>>(`/sales/sources/${id}`, {
        params: { include_archived: true },
      })
      return mapRow(data ?? {})
    }
    throw err
  }
}

export async function deleteSource(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const idx = mockSources.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('Source not found')
    mockSources[idx] = { ...mockSources[idx], isArchived: true, status: 'Archived' }
    return
  }
  await apiClient.delete(`/sales/sources/${id}`)
}

/** Q16: restore an archived source (real backend only). */
export async function restoreSource(id: number): Promise<LeadSource> {
  if (env.useMockApi) {
    await delay(300)
    const idx = mockSources.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('Source not found')
    mockSources[idx] = { ...mockSources[idx], isArchived: false, status: 'Active' }
    return mockSources[idx]
  }
  const { data } = await apiClient.post<Record<string, unknown>>(`/sales/sources/${id}/restore`)
  return mapRow(data ?? {})
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  )
}

/** @deprecated Use deleteSource (DELETE verb + soft-delete). */
export async function archiveSource(id: number): Promise<void> {
  return deleteSource(id)
}
