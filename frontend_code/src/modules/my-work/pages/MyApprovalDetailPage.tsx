import { useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { myApprovals } from '../data/mock'
import type { ApprovalStatus } from '../types'

const statusStyles: Record<ApprovalStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800',
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
}

export function MyApprovalDetailPage() {
  const { requestId } = useParams({ strict: false }) as { requestId: string }
  const item = myApprovals.find((a) => a.id === requestId) ?? myApprovals[0]

  if (!item) {
    return (
      <div>
        <PageHeader title="Request details" showBack />
        <p className="text-body-md text-on-surface-variant">Request not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={item.title} description={item.type} showBack />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant">Status</span>
          <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${statusStyles[item.status]}`}>
            {item.status}
          </span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-label-sm text-on-surface-variant">Type</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{item.type}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Submitted</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{item.submittedOn}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-label-sm text-on-surface-variant">Summary</dt>
            <dd className="text-body-md text-on-background mt-0.5">{item.summary ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
