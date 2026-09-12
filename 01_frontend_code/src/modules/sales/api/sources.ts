/**
 * Lead sources (platforms table) API.
 * Re-exported from sales.ts for the Manage Sources page.
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
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    description: (r.description as string | null) ?? null,
    isArchived: Boolean(r.is_archived ?? r.isArchived),
    leadCount: Number(r.leadCount ?? r.lead_count ?? 0),
    status: String(r.status ?? (r.is_archived || r.isArchived ? 'Archived' : 'Active')),
    createdAt: (r.created_at as string) ?? null,
    updatedAt: (r.updated_at as string) ?? null,
  }
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

  const { data } = await apiClient.get<Record<string, unknown> | unknown[]>('/sales/platforms', {
    params: {
      include_archived: opts?.includeArchived ?? false,
      with_stats: true,
    },
  })

  if (Array.isArray(data)) {
    const items = data.map((r) => mapRow(r as Record<string, unknown>))
    return { items, total: items.length, metrics: [] }
  }

  const payload = data as {
    items?: Record<string, unknown>[]
    total?: number
    metrics?: SourceMetric[]
  }
  const items = (payload.items ?? []).map(mapRow)
  return {
    items,
    total: payload.total ?? items.length,
    metrics: payload.metrics ?? [],
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
  const { data } = await apiClient.post<Record<string, unknown>>('/sales/platforms', {
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
  const { data } = await apiClient.patch<Record<string, unknown>>(`/sales/platforms/${id}`, input)
  return mapRow(data)
}

export async function archiveSource(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const idx = mockSources.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('Source not found')
    mockSources[idx] = { ...mockSources[idx], isArchived: true, status: 'Archived' }
    return
  }
  await apiClient.post(`/sales/platforms/${id}/archive`)
}
