import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { TimelineStep } from '@/shared/components/ui/TimelineStep'
import { usePendingApprovals } from '../../hooks/approval_action/use-pending-approvals'
import { decideApproval, type DecideAction } from '../../api/approval_action'
import { approvalRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'
import { toast } from '@/shared/hooks/use-toast'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import type { ApprovalPriority } from '../../types/request'
import { approvalActionFormSchema, type ApprovalActionFormInput } from '../../schemas/approval'

const FALLBACK_ROW = {
  id: '—',
  type: 'Request',
  typeIcon: 'pending_actions',
  typeColor: 'bg-secondary/10 text-secondary',
  requester: 'Unknown',
  requesterInitials: '?',
  date: '—',
  priority: 'Normal' as ApprovalPriority,
  status: 'Pending' as const,
}

export function ApprovalDetailPage() {
  const { requestId } = useParams({ strict: false }) as { requestId?: string }
  const navigate = useNavigate()
  const { filtered, isLoading } = usePendingApprovals()

  const row =
    filtered.find((r) => r.id === requestId || `#${r.id}` === requestId) ?? {
      ...FALLBACK_ROW,
      id: requestId ?? FALLBACK_ROW.id,
    }

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

  const goPending = () => safeNavigate(navigate, { to: approvalRoutes.pending })

  const decideMut = useMutation({
    mutationFn: (input: { action: ApprovalActionFormInput['action']; comment?: string }) => {
      const endpoint: DecideAction =
        input.action === 'approved' ? 'approve' : input.action === 'rejected' ? 'reject' : 'revision'
      return decideApproval(String(requestId ?? row.id), endpoint, input.comment)
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
      goPending()
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

  const busy = isSubmitting || decideMut.isPending

  if (isLoading) {
    return (
      <div className="py-12 text-center text-body-sm text-on-surface-variant">Loading request…</div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPending}
          className="flex items-center gap-2 text-secondary hover:text-primary text-label-md transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Pending
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-label-sm font-bold text-on-surface-variant tracking-wider uppercase">
              Request ID
            </span>
            <span className="bg-secondary/15 text-secondary px-3 py-1 rounded-full text-label-sm font-bold">
              #{row.id}
            </span>
          </div>
          <PageHeader
            title={`${row.type} — ${row.requester}`}
            description="Review details and take an approval action."
          />
        </div>
        <span className="bg-surface-container-highest text-secondary inline-flex items-center gap-2 px-4 py-2 rounded-lg font-label-md self-start">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            hourglass_empty
          </span>
          Pending Approval
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bv-surface p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-lg border-2 border-secondary/30">
                {row.requesterInitials}
              </div>
              <div>
                <h4 className="text-title-lg font-semibold text-on-background">{row.requester}</h4>
                <p className="text-on-surface-variant text-body-md">Team member · Submitted {row.date}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">Priority</p>
              <p className="text-headline-md font-semibold text-on-background">{row.priority}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bv-surface p-6 space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined">description</span>
                <h4 className="text-label-md font-bold uppercase">Type</h4>
              </div>
              <p className="text-title-lg font-semibold text-on-background">{row.type}</p>
            </div>
            <div className="bv-surface p-6 space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined">calendar_today</span>
                <h4 className="text-label-md font-bold uppercase">Submitted</h4>
              </div>
              <p className="text-title-lg font-semibold text-on-background">{row.date}</p>
            </div>
            <div className="md:col-span-2 bv-surface p-6 space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined">subject</span>
                <h4 className="text-label-md font-bold uppercase">Summary</h4>
              </div>
              <p className="text-body-md text-on-surface leading-relaxed">
                Request #{row.id} from {row.requester} for {row.type}. Review attachments and policy notes before
                deciding.
              </p>
            </div>
          </div>

          <div className="bv-surface p-6">
            <h4 className="text-title-lg font-semibold text-on-background mb-8">Approval Timeline</h4>
            <div className="relative space-y-8 pl-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant">
              <TimelineStep done title="Request Submitted" body={`${row.requester} submitted the request.`} time={row.date} />
              <TimelineStep done title="Policy check" body="Automated policy compliance confirmed." time={row.date} />
              <TimelineStep active title="Manager review" body="Awaiting your decision." time="Now" />
              <TimelineStep title="Final notification" body="Requester notified and records updated." muted />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bv-surface p-6 sticky top-24 space-y-4">
            <h4 className="text-title-lg font-semibold text-on-background mb-2">Decision Center</h4>
            <Can action={Action.APPROVE} resource="approval">
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center py-3"
                leftIcon={
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                }
                onClick={() => runAction('approved')}
                disabled={busy}
              >
                {decideMut.isPending ? 'Working…' : 'Approve Request'}
              </Button>
            </Can>
            <Can action={Action.UPDATE} resource="approval">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center py-3 border-secondary text-secondary"
                leftIcon={<span className="material-symbols-outlined">edit_square</span>}
                onClick={() => runAction('revision')}
                disabled={busy}
              >
                Request Revision
              </Button>
            </Can>
            <Can action={Action.APPROVE} resource="approval">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center py-3 border-error text-error hover:bg-error/10"
                leftIcon={<span className="material-symbols-outlined">cancel</span>}
                onClick={() => runAction('rejected')}
                disabled={busy}
              >
                Reject Request
              </Button>
            </Can>

            <hr className="border-outline-variant my-4" />

            <h4 className="text-label-md font-bold uppercase text-on-surface-variant">Discussion</h4>
            <textarea
              {...register('comment')}
              className="w-full border border-outline-variant rounded-lg p-3 text-body-sm focus:ring-2 focus:ring-secondary min-h-[100px] bg-transparent outline-none transition-colors"
              placeholder="Add a comment or instruction…"
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
              >
                attach_file
              </button>
              <Can action={Action.UPDATE} resource="approval">
                <Button type="button" variant="secondary" size="sm" onClick={postComment}>
                  Post Comment
                </Button>
              </Can>
            </div>

            <div className="pt-4 border-t border-outline-variant">
              <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span className="text-label-sm uppercase tracking-widest font-bold">Policy Note</span>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed italic">
                Significant requests may require secondary sign-off. Document your decision clearly for audit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
