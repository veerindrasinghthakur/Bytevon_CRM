/**
 * Approvals approval_action domain API — pending list, approvers, decide.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { APPROVER_OPTIONS, pendingApprovals } from '../data/mock'
import type { ApprovalRow } from '../types/request'
import type { ApproverOption } from '../types/approval_action'
import { delay } from '@/shared/mock/db'

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

export async function listApproverOptions(): Promise<ApproverOption[]> {
  if (env.useMockApi) {
    await delay(80)
    return APPROVER_OPTIONS.map((o) => ({ ...o }))
  }
  const { data } = await apiClient.get<ApproverOption[]>('/approvals/approvers')
  return data
}

export type DecideAction = 'approve' | 'reject' | 'revision'

export async function decideApproval(
  id: string,
  decision: DecideAction,
  comment?: string,
): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    return
  }
  // Single decide endpoint serves approve / reject / request-revision.
  await apiClient.post(`/approvals/${encodeURIComponent(id)}/${decision}`, { comment })
}
