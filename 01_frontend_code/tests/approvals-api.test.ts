import { describe, expect, it } from 'vitest'
import { getApprovalKpis, getApprovalDetail, listMyRequests } from '@/modules/approvals/api/request-api'
import { listApproverOptions, listPendingApprovals } from '@/modules/approvals/api/approval-action-api'

describe('approvals mock API', () => {
  it('returns KPI totals', async () => {
    const kpis = await getApprovalKpis()
    expect(typeof kpis.pending).toBe('number')
    expect(kpis.pending).toBeGreaterThanOrEqual(0)
  })

  it('lists my requests and pending approvals as arrays', async () => {
    const mine = await listMyRequests()
    expect(Array.isArray(mine.items ?? mine)).toBe(true)
    const pending = await listPendingApprovals()
    expect(Array.isArray(pending.items ?? pending)).toBe(true)
  })

  it('returns null detail for unknown ids and lists approver options', async () => {
    expect(await getApprovalDetail('no-such-id')).toBeNull()
    const approvers = await listApproverOptions()
    expect(Array.isArray(approvers)).toBe(true)
  })
})
