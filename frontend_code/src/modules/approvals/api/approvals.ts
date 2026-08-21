/**
 * Approvals module API — mock via data/mock; real via shared Axios client.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import {
  APPROVER_OPTIONS,
  approvalKpis,
  myRequests,
  pendingApprovals,
} from '../data/mock'
import type { ApprovalKpis, ApprovalRow, ApproverOption } from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getApprovalKpis(): Promise<ApprovalKpis> {
  if (env.useMockApi) {
    await delay()
    return { ...approvalKpis }
  }
  const { data } = await apiClient.get<ApprovalKpis>('/approvals/kpis')
  return data
}

export async function listPendingApprovals(params?: {
  search?: string
  type?: string
  priority?: string
}): Promise<ApprovalRow[]> {
  if (env.useMockApi) {
    await delay()
    let items = pendingApprovals.map((r) => ({ ...r }))
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.requester.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q),
      )
    }
    if (params?.type && params.type !== 'All') {
      items = items.filter((r) => r.type === params.type)
    }
    if (params?.priority && params.priority !== 'All') {
      items = items.filter((r) => r.priority === params.priority)
    }
    return items
  }
  const { data } = await apiClient.get<ApprovalRow[]>('/approvals/pending', { params })
  return data
}

export async function listMyRequests(params?: {
  search?: string
  status?: string
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

export async function listApproverOptions(): Promise<ApproverOption[]> {
  if (env.useMockApi) {
    await delay(80)
    return APPROVER_OPTIONS.map((o) => ({ ...o }))
  }
  const { data } = await apiClient.get<ApproverOption[]>('/approvals/approvers')
  return data
}

export async function decideApproval(
  id: string,
  decision: 'approve' | 'reject',
  comment?: string,
): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    return
  }
  await apiClient.post(`/approvals/${encodeURIComponent(id)}/${decision}`, { comment })
}
