import { useMutation, useQueryClient } from '@tanstack/react-query'
import { decideApproval } from '@/modules/approvals/api/approval-action-api'
import { invalidate, queryKeys } from '@/shared/lib/query-keys'

export function useExecutiveDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision }: { id: string | number; decision: 'approve' | 'reject' }) =>
      decideApproval(String(id), decision),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.executive() })
      void invalidate.adminLeave(qc)
    },
  })
}
