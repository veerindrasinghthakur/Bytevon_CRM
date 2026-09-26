import { useQuery } from '@tanstack/react-query'
import { getApprovalKpis } from '../api/request-api'
import { listPendingApprovals } from '../api/approval-action-api'
import { queryKeys } from '@/shared/lib/query-keys'
import { useDataScope } from '@/shared/rbac'

export function useApprovalCenter() {
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('approval')
  const kpisQuery = useQuery({
    queryKey: [...queryKeys.approvals.all, scope],
    queryFn: getApprovalKpis,
  })

  const pendingQuery = useQuery({
    queryKey: queryKeys.approvals.pending({ scope }),
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
    isError: kpisQuery.isError || pendingQuery.isError,
    error: kpisQuery.error ?? pendingQuery.error,
    refetch: () => {
      void kpisQuery.refetch()
      void pendingQuery.refetch()
    },
  }
}
