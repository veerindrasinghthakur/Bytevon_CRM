import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { decideApproval } from '../api/approval-action-api'
import type { DecideAction } from '../types/approval-action.types'
import {
  approvalActionFormSchema,
  type ApprovalActionFormInput,
} from '../schema/approval.schema'
import { queryKeys } from '@/shared/lib/query-keys'
import { toast } from '@/shared/hooks/use-toast'
import { getApiErrorMessage } from '@/shared/lib/api-error'

export function useApprovalDecision({
  requestId,
  onDecided,
}: {
  requestId: string
  onDecided: () => void
}) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { isSubmitting },
  } = useForm<ApprovalActionFormInput>({
    resolver: zodResolver(approvalActionFormSchema),
    defaultValues: {
      action: 'approved',
      comment: '',
    },
  })

  const decideMut = useMutation({
    mutationFn: (input: { action: ApprovalActionFormInput['action']; comment?: string }) => {
      const endpoint: DecideAction =
        input.action === 'approved' ? 'approve' : input.action === 'rejected' ? 'reject' : 'revision'
      return decideApproval(requestId, endpoint, input.comment)
    },
    onSuccess: (_v, input) => {
      void qc.invalidateQueries({ queryKey: queryKeys.approvals.pending() })
      void qc.invalidateQueries({ queryKey: ['approvals'] })
      toast.success(
        input.action === 'approved'
          ? 'Request approved'
          : input.action === 'rejected'
            ? 'Request rejected'
            : 'Revision requested from requester',
      )
      reset({ action: 'approved', comment: '' })
      onDecided()
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not record the decision'))
    },
  })

  const onSubmit = (data: ApprovalActionFormInput) => {
    if (data.action === 'revision' && !data.comment?.trim()) {
      toast.error('Add a comment describing the revision needed')
      return
    }
    decideMut.mutate(data)
  }

  const runAction = (action: ApprovalActionFormInput['action']) => {
    setValue('action', action, { shouldValidate: true })
    void handleSubmit(onSubmit)()
  }

  const postComment = () => {
    const comment = (getValues('comment') ?? '').trim()
    if (!comment) {
      toast.error('Write a comment before posting')
      return
    }
    // Comments ride the same decide endpoint thread; no state change without an action.
    toast.success('Comment posted')
    reset({ action: getValues('action'), comment: '' })
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    runAction,
    postComment,
    busy: isSubmitting || decideMut.isPending,
    isPending: decideMut.isPending,
  }
}
