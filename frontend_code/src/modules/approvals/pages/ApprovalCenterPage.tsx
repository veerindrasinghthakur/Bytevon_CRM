import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { approvalKpis, pendingApprovals } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const priorityStyles: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Normal: 'bg-blue-50 text-blue-600',
  Low: 'bg-surface-container text-on-surface-variant',
}

export function ApprovalCenterPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Center"
        description="Manage and process organizational requests."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[20px]">history</span>}
            >
              Log
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[20px]">file_export</span>}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* KPI grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="stacks"
          iconClass="bg-secondary/5 text-secondary"
          label="Total Approvals"
          value={approvalKpis.total}
          trend="Stable"
        />
        <KpiCard
          icon="pending_actions"
          iconClass="bg-secondary/15 text-secondary"
          label="Pending Approvals"
          value={approvalKpis.pending}
          trend="12%"
          trendUp
          onClick={() => navigate({ to: '/approvals/pending' })}
        />
        <KpiCard
          icon="task_alt"
          iconClass="bg-emerald-100 text-emerald-700"
          label="Approved Today"
          value={approvalKpis.approvedToday}
          trend="8%"
          trendUp
          trendClass="text-emerald-600"
        />
        <KpiCard
          icon="cancel"
          iconClass="bg-red-100 text-red-700"
          label="Rejected Today"
          value={approvalKpis.rejectedToday}
          trend="Stable"
        />
      </section>

      {/* Table */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <select className="pl-3 pr-8 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary outline-none">
              <option>All Request Types</option>
              <option>Leave Request</option>
              <option>Expense Claim</option>
              <option>Purchase Order</option>
            </select>
            <select className="pl-3 pr-8 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary outline-none">
              <option>Status: Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-label-md text-secondary hover:bg-secondary/5 rounded-lg"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Last 30 Days
            </button>
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Showing 1–{Math.min(10, pendingApprovals.length)} of {approvalKpis.pending} requests
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {pendingApprovals.slice(0, 5).map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-container-low/50 cursor-pointer"
                  onClick={() => navigate({ to: '/approvals/pending' })}
                >
                  <td className="px-6 py-4 font-medium text-secondary">#{row.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('p-1.5 rounded-md', row.typeColor)}>
                        <span className="material-symbols-outlined text-[16px]">{row.typeIcon}</span>
                      </span>
                      <span className="text-body-sm font-medium">{row.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-label-sm text-secondary border border-outline-variant">
                        {row.requesterInitials}
                      </div>
                      <span className="text-body-sm">{row.requester}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{row.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide',
                        priorityStyles[row.priority]
                      )}
                    >
                      {row.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold text-label-sm">
                      <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                      Pending
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-2 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                        title="Quick Approve"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-red-100 text-red-700 rounded-lg"
                        title="Quick Reject"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant"
                        title="View"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <div className="flex gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-white font-bold text-sm">
              1
            </span>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-sm">
              2
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-sm">
              3
            </button>
          </div>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </section>
    </div>
  )
}

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  trend,
  trendUp,
  trendClass,
  onClick,
}: {
  icon: string
  iconClass: string
  label: string
  value: number
  trend: string
  trendUp?: boolean
  trendClass?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm text-left w-full hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={cn('p-2 rounded-lg', iconClass)}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        <div
          className={cn(
            'flex items-center gap-1 text-label-sm',
            trendClass ?? 'text-on-surface-variant'
          )}
        >
          <span className="material-symbols-outlined text-[14px]">
            {trendUp ? 'trending_up' : 'trending_flat'}
          </span>
          <span>{trend}</span>
        </div>
      </div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <h3 className="text-headline-md font-semibold text-on-background">{value}</h3>
    </button>
  )
}
