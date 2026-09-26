/**
 * Approvals request domain API — KPIs, my-requests list, request detail.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { approvalKpis, myRequests, pendingApprovals } from '../data/mock'
import type { ApprovalKpis, ApprovalRow } from '../types/request'
import { delay } from '@/shared/mock/db'

export async function getApprovalKpis(): Promise<ApprovalKpis> {
  if (env.useMockApi) {
    await delay()
    return { ...approvalKpis }
  }
  const { data } = await apiClient.get<ApprovalKpis>('/approvals/kpis')
  return data
}

export async function listMyRequests(params?: {
  search?: string
  status?: string
  /** Data-boundary hint; backend enforces from auth token. */
  scope?: string
}): Promise<ApprovalRow[]> {
  if (env.useMockApi) {
    await delay()
    let items = myRequests.map((r) => ({ ...r }))
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.stage ?? '').toLowerCase().includes(q),
      )
    }
    if (params?.status && params.status !== 'All') {
      items = items.filter((r) => r.status === params.status)
    }
    return items
  }
  const { data } = await apiClient.get<ApprovalRow[]>('/approvals/my-requests', { params })
  return data
}

export async function getApprovalDetail(id: string): Promise<ApprovalRow | null> {
  if (env.useMockApi) {
    await delay()
    const row =
      pendingApprovals.find((r) => r.id === id) ?? myRequests.find((r) => r.id === id) ?? null
    return row ? { ...row } : null
  }
  const { data } = await apiClient.get<ApprovalRow>(`/approvals/${encodeURIComponent(id)}`)
  return data
}
