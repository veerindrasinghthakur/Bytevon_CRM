import { useQuery } from '@tanstack/react-query'
import { getApprovalKpis, listPendingApprovals } from '../api/approvals'
import { queryKeys } from '@/shared/lib/query-keys'

export function useApprovalCenter() {
  const kpisQuery = useQuery({
    queryKey: queryKeys.approvals.all,
    queryFn: getApprovalKpis,
  })

  const pendingQuery = useQuery({
    queryKey: queryKeys.approvals.pending({}),
    queryFn: () => listPendingApprovals(),
  })

  const pending = pendingQuery.data ?? []
  const kpis = kpisQuery.data
  const rows = pending.slice(0, 5)
  const showingCount = Math.min(10, pending.length)

  return {
    kpis: kpis ?? {
      total: 0,
      pending: 0,
      approvedToday: 0,
      rejectedToday: 0,
      overdue: 0,
    },
    rows,
    showingCount,
    pendingTotal: kpis?.pending ?? pending.length,
    isLoading: kpisQuery.isLoading || pendingQuery.isLoading,
  }
}
