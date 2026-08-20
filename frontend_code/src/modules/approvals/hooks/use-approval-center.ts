import { approvalKpis, pendingApprovals } from '../data/mock'

export function useApprovalCenter() {
  const rows = pendingApprovals.slice(0, 5)
  const showingCount = Math.min(10, pendingApprovals.length)

  return {
    kpis: approvalKpis,
    rows,
    showingCount,
    pendingTotal: approvalKpis.pending,
  }
}
