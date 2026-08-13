import { useParams, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leaveRequests, currentUser } from '../data/mock'
import type { LeaveStatus } from '../types'

const statusStyles: Record<LeaveStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800',
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
  Cancelled: 'bg-surface-container text-on-surface-variant',
}

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const navigate = useNavigate()
  const req = leaveRequests.find((r) => r.id === leaveId) ?? leaveRequests[0]

  if (!req) {
    return (
      <div>
        <PageHeader title="Leave details" showBack />
        <p className="text-body-md text-on-surface-variant">Request not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${req.type} leave`}
        description={`${req.from} → ${req.to} · ${req.days} day(s)`}
        showBack
        actions={
          req.status === 'Pending' ? (
            <Button variant="outline" onClick={() => console.info('Cancel leave', req.id)}>
              Cancel request
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="text-title-lg text-on-background mb-4">Overview</h3>
            <p className="text-body-md text-on-surface-variant">{req.reason}</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-label-sm text-on-surface-variant">From</p>
                <p className="text-body-lg font-bold text-on-background mt-1">{req.from}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-label-sm text-on-surface-variant">To</p>
                <p className="text-body-lg font-bold text-on-background mt-1">{req.to}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="text-title-lg text-on-background mb-3">Approval trail</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-body-md">
                <span className="material-symbols-outlined text-secondary text-xl">send</span>
                <div>
                  <p className="font-medium text-on-background">Submitted</p>
                  <p className="text-label-sm text-on-surface-variant">{req.appliedOn}</p>
                </div>
              </li>
              {req.approver && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                  <div>
                    <p className="font-medium text-on-background">Handled by {req.approver}</p>
                    <p className="text-label-sm text-on-surface-variant">Status: {req.status}</p>
                  </div>
                </li>
              )}
              {req.status === 'Pending' && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-amber-600 text-xl">hourglass_empty</span>
                  <div>
                    <p className="font-medium text-on-background">Awaiting manager</p>
                    <p className="text-label-sm text-on-surface-variant">No decision yet</p>
                  </div>
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Status</h3>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-label-sm font-semibold ${statusStyles[req.status]}`}>
              {req.status}
            </span>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
            <div>
              <p className="text-label-sm text-on-surface-variant">Type</p>
              <p className="text-body-md text-on-surface mt-0.5">{req.type}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Days</p>
              <p className="text-body-md text-on-surface mt-0.5">{req.days}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Applied on</p>
              <p className="text-body-md text-on-surface mt-0.5">{req.appliedOn}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Approver</p>
              <p className="text-body-md text-on-surface mt-0.5">{req.approver ?? '—'}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Employee</p>
              <p className="text-body-md text-on-surface mt-0.5">{currentUser.name}</p>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate({ to: '/my-work/leave/apply' })}
            >
              Apply again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: '/my-work/leave' })}
            >
              All leave requests
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
