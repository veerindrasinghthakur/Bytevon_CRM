import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { pendingApprovals } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const priorityStyles: Record<string, string> = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-surface-container-low text-on-surface-variant',
  Normal: 'bg-blue-50 text-blue-600',
  Low: 'bg-surface-container text-on-surface-variant',
}

export function PendingApprovalsPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          onClick={() => navigate({ to: '/approvals' })}
          className="flex items-center gap-2 text-secondary hover:text-primary text-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Approval Center
        </button>
      </div>

      <PageHeader
        title="Pending Requests"
        description="Review and act on items waiting for your decision."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[20px]">filter_list</span>}
            >
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[20px]">download</span>}
            >
              Export
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-surface-container text-secondary rounded-lg material-symbols-outlined">
              pending_actions
            </span>
            <span className="text-label-sm text-on-surface-variant">+12%</span>
          </div>
          <p className="text-label-md text-on-surface-variant">Pending</p>
          <h3 className="text-headline-lg font-semibold text-on-background mt-1">24</h3>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg material-symbols-outlined">
              check_circle
            </span>
            <span className="text-label-sm text-on-surface-variant">Today</span>
          </div>
          <p className="text-label-md text-on-surface-variant">Approved Today</p>
          <h3 className="text-headline-lg font-semibold text-on-background mt-1">156</h3>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-red-50 text-error rounded-lg material-symbols-outlined">cancel</span>
            <span className="text-label-sm text-on-surface-variant">Today</span>
          </div>
          <p className="text-label-md text-on-surface-variant">Rejected Today</p>
          <h3 className="text-headline-lg font-semibold text-on-background mt-1">4</h3>
        </div>
        <div className="bg-secondary p-4 rounded-xl border border-outline-variant shadow-sm text-white">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-white/20 rounded-lg material-symbols-outlined">priority_high</span>
          </div>
          <p className="text-label-md opacity-80">Action Required</p>
          <h3 className="text-headline-lg font-semibold mt-1">08</h3>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-label-md text-on-surface-variant">ID</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant">Type</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant">Requester</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant">Date</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant">Priority</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {pendingApprovals.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low">
                  <td className="px-6 py-4 text-body-sm font-medium">#{row.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={cn('p-1.5 rounded-md material-symbols-outlined text-[18px]', row.typeColor)}>
                        {row.typeIcon}
                      </span>
                      <span className="text-body-sm">{row.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-label-sm font-bold text-secondary">
                        {row.requesterInitials}
                      </div>
                      <span className="text-body-sm">{row.requester}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{row.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-label-sm font-medium',
                        priorityStyles[row.priority]
                      )}
                    >
                      {row.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-surface-container text-secondary text-label-sm font-medium rounded-full">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve">
                        <span className="material-symbols-outlined">check</span>
                      </button>
                      <button type="button" className="p-2 text-error hover:bg-red-50 rounded-lg" title="Reject">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                      <button type="button" className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg" title="View">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
          <span className="text-body-sm text-on-surface-variant">
            Showing {pendingApprovals.length} of 24 pending requests
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="p-1 border border-outline-variant rounded opacity-50" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-label-md px-2">1</span>
            <button type="button" className="p-1 border border-outline-variant rounded hover:bg-white">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
