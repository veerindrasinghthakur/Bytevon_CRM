import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { KpiCard } from '@/shared/components/ui/KpiCard'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useApprovalCenter } from '../../hooks/request/use-approval-center'
import { approvalRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { cn } from '@/shared/lib/cn'
import { ExportButton } from '@/shared/components/export/ExportButton'
import {
  approvalPriorityStyles,
  approvalStatusOptions,
  approvalTypeOptions,
} from '../../enums'

export function ApprovalCenterPage() {
  const navigate = useNavigate()
  const { kpis, rows, showingCount, pendingTotal, isError, error, refetch } = useApprovalCenter()

  const goPending = () => safeNavigate(navigate, { to: approvalRoutes.pending })

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Approval Center"
          description="Manage and process organizational requests."
        />
        <ErrorState
          title="Could not load approvals"
          description={getApiErrorMessage(error, 'We could not load approval requests.')}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Approval Center"
        description="Manage and process organizational requests."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[20px]">history</span>}>
              Log
            </Button>
            <ExportButton resource="approval" filenameStem="approval-center" label="Export" />
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="stacks"
          iconClass="bg-secondary/5 text-secondary"
          label="Total Approvals"
          value={kpis.total}
          trend="Stable"
        />
        <KpiCard
          icon="pending_actions"
          iconClass="bg-secondary/15 text-secondary"
          label="Pending Approvals"
          value={kpis.pending}
          trend="12%"
          trendUp
          onClick={goPending}
        />
        <KpiCard
          icon="task_alt"
          iconClass="bg-secondary/15 text-secondary"
          label="Approved Today"
          value={kpis.approvedToday}
          trend="8%"
          trendUp
          trendClass="text-secondary"
        />
        <KpiCard
          icon="cancel"
          iconClass="bg-error/10 text-error"
          label="Rejected Today"
          value={kpis.rejectedToday}
          trend="Stable"
        />
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <Select
              value="All"
              onChange={() => {}}
              placeholder="All Request Types"
              options={approvalTypeOptions}
              minWidthClass="min-w-[160px]"
            />
            <Select
              value="Pending"
              onChange={() => {}}
              placeholder="Status: Pending"
              options={approvalStatusOptions}
              minWidthClass="min-w-[140px]"
            />
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-label-md text-secondary hover:bg-secondary/5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Last 30 Days
            </button>
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Showing 1–{showingCount} of {pendingTotal} requests
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Status</th>
                {/* Actions column hidden (quick approve/reject/view) — row click opens
                    pending list. Restore the block below when row actions return.
                <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Actions</th>
                */}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="zebra-row cursor-pointer"
                  onClick={goPending}
                >
                  <td className="px-6 py-4 font-medium text-secondary">#{row.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('p-1.5 rounded-md bg-secondary/10 text-secondary')}>
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
                    <span className={cn('px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide', approvalPriorityStyles[row.priority])}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-bold text-label-sm">
                      <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                      Pending
                    </div>
                  </td>
                  {/* Quick approve/reject/view hidden with the Actions column.
                      Row click still opens the pending list. Restore with the
                      Actions <th> above when row actions return.
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-2 hover:bg-secondary/10 text-secondary rounded-lg transition-colors"
                        title="Quick Approve"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
                        title="Quick Reject"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
                        title="View"
                        onClick={goPending}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </div>
                  </td>
                  */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
          <Button variant="outline" size="sm">Previous</Button>
          <div className="flex gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-on-secondary font-bold text-sm">1</span>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-sm transition-colors">2</button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-sm transition-colors">3</button>
          </div>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </section>
    </div>
  )
}
