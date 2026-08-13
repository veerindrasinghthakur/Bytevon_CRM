import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leaveBalances, leaveRequests } from '../data/mock'
import type { LeaveStatus } from '../types'

const statusStyles: Record<LeaveStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800',
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
  Cancelled: 'bg-surface-container text-on-surface-variant',
}

export function MyLeavePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave"
        description="Check balances, apply for leave, and track request status."
        showBack
        backTo="/my-work"
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">event_available</span>}
          >
            Apply for Leave
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {leaveBalances.map((lb) => (
          <div
            key={lb.type}
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant border-l-4 border-l-secondary shadow-sm"
          >
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">
              {lb.type} Leave
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-secondary">{lb.remaining}</span>
              <span className="text-label-md text-on-surface-variant">days left</span>
            </div>
            <p className="text-label-sm text-on-surface-variant mt-2">
              {lb.used} used · {lb.total} total
            </p>
            <div className="mt-3 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full"
                style={{ width: `${(lb.used / lb.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-title-lg font-semibold text-on-background">Leave requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">From</th>
                <th className="px-6 py-3 font-semibold">To</th>
                <th className="px-6 py-3 font-semibold">Days</th>
                <th className="px-6 py-3 font-semibold">Reason</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {leaveRequests.map((req) => (
                <tr key={req.id} className="hover:bg-secondary/5">
                  <td className="px-6 py-4 text-label-md font-semibold text-on-background">{req.type}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.from}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.to}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.days}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant max-w-[200px] truncate">
                    {req.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${statusStyles[req.status]}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.appliedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
