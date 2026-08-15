import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { pendingApprovals } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function ApprovalDetailPage() {
  const { requestId } = useParams({ strict: false }) as { requestId?: string }
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [actionDone, setActionDone] = useState<'approved' | 'rejected' | 'revision' | null>(null)

  const row =
    pendingApprovals.find((r) => r.id === requestId || `#${r.id}` === requestId) ??
    pendingApprovals[0]

  const act = async (kind: 'approved' | 'rejected' | 'revision') => {
    setActionDone(kind)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ to: '/approvals/pending' })}
          className="flex items-center gap-2 text-secondary hover:text-primary text-label-md"
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

      {actionDone && (
        <div
          className={cn(
            'px-4 py-3 rounded-lg text-body-sm font-medium',
            actionDone === 'approved' && 'bg-emerald-50 text-emerald-800',
            actionDone === 'rejected' && 'bg-red-50 text-red-800',
            actionDone === 'revision' && 'bg-amber-50 text-amber-800'
          )}
        >
          {actionDone === 'approved' && 'Request approved (mock).'}
          {actionDone === 'rejected' && 'Request rejected (mock).'}
          {actionDone === 'revision' && 'Revision requested (mock).'}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Requester */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex items-center justify-between">
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
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined">description</span>
                <h4 className="text-label-md font-bold uppercase">Type</h4>
              </div>
              <p className="text-title-lg font-semibold text-on-background">{row.type}</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined">calendar_today</span>
                <h4 className="text-label-md font-bold uppercase">Submitted</h4>
              </div>
              <p className="text-title-lg font-semibold text-on-background">{row.date}</p>
            </div>
            <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-2">
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

          {/* Timeline */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h4 className="text-title-lg font-semibold text-on-background mb-8">Approval Timeline</h4>
            <div className="relative space-y-8 pl-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant">
              <TimelineStep done title="Request Submitted" body={`${row.requester} submitted the request.`} time={row.date} />
              <TimelineStep done title="Policy check" body="Automated policy compliance confirmed." time={row.date} />
              <TimelineStep active title="Manager review" body="Awaiting your decision." time="Now" />
              <TimelineStep title="Final notification" body="Requester notified and records updated." muted />
            </div>
          </div>
        </div>

        {/* Decision Center */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm sticky top-24 space-y-4">
            <h4 className="text-title-lg font-semibold text-on-background mb-2">Decision Center</h4>
            <Button
              variant="primary"
              className="w-full justify-center py-3"
              leftIcon={<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
              onClick={() => act('approved')}
              disabled={actionDone !== null}
            >
              Approve Request
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center py-3 border-secondary text-secondary"
              leftIcon={<span className="material-symbols-outlined">edit_square</span>}
              onClick={() => act('revision')}
              disabled={actionDone !== null}
            >
              Request Revision
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center py-3 border-error text-error hover:bg-red-50"
              leftIcon={<span className="material-symbols-outlined">cancel</span>}
              onClick={() => act('rejected')}
              disabled={actionDone !== null}
            >
              Reject Request
            </Button>

            <hr className="border-outline-variant my-4" />

            <h4 className="text-label-md font-bold uppercase text-on-surface-variant">Discussion</h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-outline-variant rounded-lg p-3 text-body-sm focus:ring-2 focus:ring-secondary min-h-[100px] bg-transparent outline-none"
              placeholder="Add a comment or instruction…"
            />
            <div className="flex justify-between items-center">
              <button type="button" className="material-symbols-outlined text-on-surface-variant hover:text-primary">
                attach_file
              </button>
              <Button variant="secondary" size="sm">
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
    </div>
  )
}

function TimelineStep({
  title,
  body,
  time,
  done,
  active,
  muted,
}: {
  title: string
  body: string
  time?: string
  done?: boolean
  active?: boolean
  muted?: boolean
}) {
  return (
    <div className={cn('relative', muted && 'opacity-40')}>
      <div
        className={cn(
          'absolute -left-[37px] top-0 w-7 h-7 rounded-full flex items-center justify-center border-4 border-surface-container-lowest z-10',
          done && 'bg-secondary text-white',
          active && 'bg-secondary/80 text-white',
          !done && !active && 'bg-outline-variant text-white'
        )}
      >
        <span className="material-symbols-outlined text-[14px]" style={done ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          {done ? 'check' : active ? 'pending' : 'radio_button_unchecked'}
        </span>
      </div>
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className={cn('text-label-md font-medium', active ? 'text-secondary font-bold' : 'text-on-background')}>
            {title}
          </p>
          <p className="text-body-sm text-on-surface-variant">{body}</p>
        </div>
        {time && <p className="text-label-sm text-on-surface-variant shrink-0">{time}</p>}
      </div>
    </div>
  )
}
