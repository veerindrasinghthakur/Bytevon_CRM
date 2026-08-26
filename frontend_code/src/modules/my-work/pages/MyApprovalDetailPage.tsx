import { useParams, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { myApprovals, currentUser } from '../data/mock'
import type { ApprovalStatus } from '../types'
import { safeNavigate } from '@/shared/lib/safeNavigate'

const statusStyles: Record<ApprovalStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800',
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
}

const typeIcon: Record<string, string> = {
  Leave: 'event_busy',
  'Attendance Correction': 'edit_calendar',
  Expense: 'payments',
  Other: 'description',
}

export function MyApprovalDetailPage() {
  const { requestId } = useParams({ strict: false }) as { requestId: string }
  const navigate = useNavigate()
  const item = myApprovals.find((a) => a.id === requestId) ?? myApprovals[0]

  if (!item) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Approval details" showBack />
        <p className="text-body-md text-on-surface-variant">Request not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={item.title}
        description={item.type}
        showBack
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {typeIcon[item.type] ?? 'description'}
                </span>
              </div>
              <div>
                <h3 className="text-title-lg text-on-background">Overview</h3>
                <p className="text-body-md text-on-surface-variant mt-2">
                  {item.summary ?? 'No additional summary provided for this request.'}
                </p>
              </div>
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg text-on-background mb-3">History</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-body-md">
                <span className="material-symbols-outlined text-secondary text-xl">send</span>
                <div>
                  <p className="font-medium text-on-background">Submitted by {currentUser.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{item.submittedOn}</p>
                </div>
              </li>
              {item.status === 'Approved' && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
                  <div>
                    <p className="font-medium text-on-background">Approved</p>
                    <p className="text-label-sm text-on-surface-variant">Decision recorded (mock)</p>
                  </div>
                </li>
              )}
              {item.status === 'Pending' && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-amber-600 text-xl">pending</span>
                  <div>
                    <p className="font-medium text-on-background">Pending review</p>
                    <p className="text-label-sm text-on-surface-variant">Waiting for approver</p>
                  </div>
                </li>
              )}
              {item.status === 'Rejected' && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-error text-xl">cancel</span>
                  <div>
                    <p className="font-medium text-on-background">Rejected</p>
                    <p className="text-label-sm text-on-surface-variant">See notes from approver when available</p>
                  </div>
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <section className="bv-surface p-6">
            <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Status</h3>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-label-sm font-semibold ${statusStyles[item.status]}`}>
              {item.status}
            </span>
          </section>

          <section className="bv-surface p-6 space-y-4">
            <div>
              <p className="text-label-sm text-on-surface-variant">Type</p>
              <p className="text-body-md text-on-surface mt-0.5">{item.type}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Submitted</p>
              <p className="text-body-md text-on-surface mt-0.5">{item.submittedOn}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Requester</p>
              <p className="text-body-md text-on-surface mt-0.5">{currentUser.name}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Summary</p>
              <p className="text-body-md text-on-surface mt-0.5">{item.summary ?? '—'}</p>
            </div>
          </section>

          <section className="bv-surface p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => safeNavigate(navigate,{ to: '/my-work/approvals' })}
            >
              All my approvals
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => safeNavigate(navigate,{ to: '/my-work/requests' })}
            >
              Open full requests table
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
