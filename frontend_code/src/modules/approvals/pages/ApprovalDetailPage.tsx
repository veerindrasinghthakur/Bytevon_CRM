import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useApprovalCenter } from '../hooks/use-approval-center'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { TimelineStep } from '@/shared/components/ui/TimelineStep'

const actionSchema = z.object({
  action: z.enum(['approved', 'rejected', 'revision']),
  comment: z.string().optional(),
})

type ActionFormData = z.infer<typeof actionSchema>

export function ApprovalDetailPage() {
  const { requestId } = useParams({ strict: false }) as { requestId?: string }
  const navigate = useNavigate()
  const { kpis } = useApprovalCenter()
  const pendingApprovals = kpis ? [] : []

  const row =
    pendingApprovals.find((r) => r.id === requestId || `#${r.id}` === requestId) ?? {
      id: 'REQ-8902',
      type: 'Leave Request',
      typeIcon: 'flight_takeoff',
      typeColor: 'bg-blue-100 text-blue-700',
      requester: 'Sarah Adams',
      requesterInitials: 'SA',
      date: 'Oct 24, 2023',
      priority: 'High' as const,
      status: 'Pending' as const,
    }

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      action: 'approved',
      comment: '',
    },
  })

  const onSubmit = (data: ActionFormData) => {
    console.log('Action:', data.action, 'Comment:', data.comment)
    reset({ action: 'approved', comment: '' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => safeNavigate(navigate, { to: '/approvals/pending' })}
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
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center py-3"
              leftIcon={<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
              onClick={() => handleSubmit(() => {})({ action: 'approved', comment: '' })}
              disabled={isSubmitting}
            >
              Approve Request
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center py-3 border-secondary text-secondary"
              leftIcon={<span className="material-symbols-outlined">edit_square</span>}
              onClick={() => handleSubmit(() => {})({ action: 'revision', comment: '' })}
              disabled={isSubmitting}
            >
              Request Revision
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center py-3 border-error text-error hover:bg-red-50"
              leftIcon={<span className="material-symbols-outlined">cancel</span>}
              onClick={() => handleSubmit(() => {})({ action: 'rejected', comment: '' })}
              disabled={isSubmitting}
            >
              Reject Request
            </Button>

            <hr className="border-outline-variant my-4" />

            <h4 className="text-label-md font-bold uppercase text-on-surface-variant">Discussion</h4>
            <textarea
              {...register('comment')}
              className="w-full border border-outline-variant rounded-lg p-3 text-body-sm focus:ring-2 focus:ring-secondary min-h-[100px] bg-transparent outline-none transition-colors"
              placeholder="Add a comment or instruction…"
            />
            <div className="flex justify-between items-center">
              <button type="button" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
                attach_file
              </button>
              <Button type="button" variant="secondary" size="sm">
                Post Comment
              </Button>
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
