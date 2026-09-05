/**
 * Centralized sales list/detail cache helpers (queryKeys only — no string literals).
 */
import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import type { Client, Lead, LeadListData, ClientListData } from '../types'

export function findLeadInCache(qc: QueryClient, id: string): Lead | undefined {
  const detail = qc.getQueryData<Lead>(queryKeys.sales.leads.detail(id))
  if (detail) return detail
  const lists = qc.getQueriesData<LeadListData>({ queryKey: queryKeys.sales.leads.all })
  for (const [, data] of lists) {
    const found = data?.items?.find((l) => l.id === id)
    if (found) return found
  }
  return undefined
}

export function findClientInCache(qc: QueryClient, id: string): Client | undefined {
  const detail = qc.getQueryData<Client>(queryKeys.sales.clients.detail(id))
  if (detail) return detail
  const lists = qc.getQueriesData<ClientListData>({ queryKey: queryKeys.sales.clients.all })
  for (const [, data] of lists) {
    const found = data?.items?.find((c) => c.id === id)
    if (found) return found
  }
  return undefined
}

export function upsertLeadInLists(qc: QueryClient, row: Lead) {
  qc.setQueriesData<LeadListData>({ queryKey: queryKeys.sales.leads.all }, (old) => {
    if (!old?.items) return old
    const exists = old.items.some((l) => l.id === row.id)
    const items = exists
      ? old.items.map((l) => (l.id === row.id ? { ...l, ...row } : l))
      : [row, ...old.items]
    return {
      ...old,
      items,
      total: exists ? old.total : (old.total ?? items.length) + 1,
    }
  })
  qc.setQueryData(queryKeys.sales.leads.detail(row.id), row)
}

export function upsertClientInLists(qc: QueryClient, row: Client) {
  qc.setQueriesData<ClientListData>({ queryKey: queryKeys.sales.clients.all }, (old) => {
    if (!old?.items) return old
    const exists = old.items.some((c) => c.id === row.id)
    const items = exists
      ? old.items.map((c) => (c.id === row.id ? { ...c, ...row } : c))
      : [row, ...old.items]
    return {
      ...old,
      items,
      total: exists ? old.total : (old.total ?? items.length) + 1,
    }
  })
  qc.setQueryData(queryKeys.sales.clients.detail(row.id), row)
}

/** Merge patch onto known row — avoids Partial→full `as Lead` casts on optimistic updates. */
export function mergeLead(previous: Lead, patch: Partial<Lead>, id: string): Lead {
  return { ...previous, ...patch, id }
}

export function mergeClient(previous: Client, patch: Partial<Client>, id: string): Client {
  return { ...previous, ...patch, id }
}
