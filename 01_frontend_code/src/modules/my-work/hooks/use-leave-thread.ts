import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'
import { listLeaveThread, postLeaveComment } from '../api/my-work'

export function useLeaveThread(
  leaveId: string,
  fallback?: { reason: string; appliedOn: string; approver?: string; approverRemarks?: string; decidedOn?: string },
) {
  const qc = useQueryClient()
  const threadQuery = useQuery({
    queryKey: [...queryKeys.myWork.leave.list({ pageSize: 100 }), 'thread', leaveId] as const,
    queryFn: () => listLeaveThread(leaveId, fallback),
    enabled: Boolean(leaveId),
  })

  const commentMut = useMutation({
    mutationFn: (remarks: string) => postLeaveComment(leaveId, remarks),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...queryKeys.myWork.leave.list({ pageSize: 100 }), 'thread', leaveId],
      })
      void qc.invalidateQueries({ queryKey: queryKeys.myWork.leave.list({ pageSize: 100 }) })
      toast.success('Comment added — the approver can see it')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not add the comment'))
    },
  })

  return {
    entries: threadQuery.data ?? [],
    isLoading: threadQuery.isLoading,
    refetch: threadQuery.refetch,
    postComment: commentMut.mutate,
    isPosting: commentMut.isPending,
  }
}
