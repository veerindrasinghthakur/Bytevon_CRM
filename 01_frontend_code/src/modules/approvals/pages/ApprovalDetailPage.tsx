import { useNavigate, useParams } from '@tanstack/react-router'
import { usePendingApprovals } from '../hooks/use-pending-approvals'
import { useApprovalDecision } from '../hooks/use-approval-decision'
import { ApprovalDetailHeader } from '../components/approval-detail-header'
import { ApprovalDetailOverview } from '../components/approval-detail-overview'
import { ApprovalTimeline } from '../components/approval-timeline'
import { ApprovalDecisionPanel } from '../components/approval-decision-panel'
import { approvalRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import type { ApprovalPriority } from '../types/approval.types'

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

  const goPending = () => safeNavigate(navigate, { to: approvalRoutes.pending })
  const { register, handleSubmit, onSubmit, runAction, postComment, busy, isPending } =
    useApprovalDecision({ requestId: String(requestId ?? row.id), onDecided: goPending })

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

      <ApprovalDetailHeader row={row} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <ApprovalDetailOverview row={row} />
          <ApprovalTimeline requester={row.requester} date={row.date} />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <ApprovalDecisionPanel
            register={register}
            busy={busy}
            isPending={isPending}
            onRunAction={runAction}
            onPostComment={postComment}
          />
        </div>
      </div>
    </form>
  )
}
