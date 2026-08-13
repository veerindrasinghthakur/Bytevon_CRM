import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { myApprovals } from '../data/mock'
import type { ApprovalStatus } from '../types'

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

export function MyApprovalsPage() {
  const navigate = useNavigate()
  const pending = myApprovals.filter((a) => a.status === 'Pending').length
  const approved = myApprovals.filter((a) => a.status === 'Approved').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Requests"
        description="Leave, attendance corrections, and other requests you submitted."
        showBack
        onBack={() => navigate({ to: '/my-work' })}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">Pending</p>
          <p className="text-headline-md font-bold text-amber-600">{pending}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">Awaiting decision</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">Approved</p>
          <p className="text-headline-md font-bold text-emerald-600">{approved}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">This period</p>
        </div>
      </section>

      <section className="space-y-3">
        {myApprovals.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:border-secondary/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[22px]">
                {typeIcon[item.type] ?? 'description'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-label-md font-semibold text-on-background">{item.title}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${statusStyles[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-label-sm text-on-surface-variant">
                {item.type} · Submitted {item.submittedOn}
                {item.summary ? ` · ${item.summary}` : ''}
              </p>
            </div>
            <button type="button" className="text-label-md font-medium text-secondary hover:underline shrink-0">
              View details
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}
