import { useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { leaveRequests } from '../data/mock'
import type { LeaveStatus } from '../types'

const statusStyles: Record<LeaveStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800',
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
  Cancelled: 'bg-surface-container text-on-surface-variant',
}

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
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
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={`${req.type} leave`}
        description={`${req.from} → ${req.to}`}
        showBack
      />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant">Status</span>
          <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${statusStyles[req.status]}`}>
            {req.status}
          </span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-label-sm text-on-surface-variant">Type</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{req.type}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Days</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{req.days}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">From</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{req.from}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">To</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{req.to}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Applied on</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{req.appliedOn}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Approver</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{req.approver ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-label-sm text-on-surface-variant">Reason</dt>
            <dd className="text-body-md text-on-background mt-0.5">{req.reason}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
