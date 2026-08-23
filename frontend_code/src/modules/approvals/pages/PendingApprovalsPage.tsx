import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickPersonRow,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { ResourceName } from '@/shared/schema'
import { usePendingApprovals } from '../hooks/use-pending-approvals'
import { useApprovalCenter } from '../hooks/use-approval-center'
import type { ApprovalRow } from '../types'
import { cn } from '@/shared/lib/cn'

const priorityStyles: Record<string, string> = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-surface-container-low text-on-surface-variant',
  Normal: 'bg-blue-50 text-blue-600',
  Low: 'bg-surface-container text-on-surface-variant',
}

const priorityDot: Record<string, string> = {
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Normal: 'bg-blue-500',
  Low: 'bg-slate-400',
}

function ApprovalQuickContent({ row }: { row: ApprovalRow }) {
  return (
    <>
      <QuickSection title="Request">
        <QuickStatGrid>
          <QuickStat icon={row.typeIcon} value={row.type} label="Type" />
          <QuickStat icon="priority_high" value={row.priority} label="Priority" />
          <QuickStat icon="event" value={row.date} label="Date" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Status">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="info" label="Status" value={row.status} />
          {row.stage && <QuickMetaTile icon="account_tree" label="Stage" value={row.stage} />}
        </div>
      </QuickSection>
      <QuickSection title="People">
        <QuickPersonRow
          initials={row.requesterInitials}
          roleLabel="Requester"
          name={row.requester}
        />
        {row.approver && (
          <QuickRelatedRow icon="how_to_reg" label="Approver" value={row.approver} />
        )}
      </QuickSection>
      <QuickSection title="Identity">
        <QuickRelatedRow icon="tag" label="ID" value={`#${row.id}`} />
      </QuickSection>
    </>
  )
}

export function PendingApprovalsPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const { filtered, search, setSearch, isLoading } = usePendingApprovals()
  const { kpis } = useApprovalCenter()

  const openApprovalOverview = (row: ApprovalRow) => {
    openPanel({
      title: row.type,
      subtitle: `#${row.id} · ${row.requester}`,
      icon: row.typeIcon || 'pending_actions',
      status: row.status,
      statusDotClass: priorityDot[row.priority] ?? 'bg-secondary',
      content: <ApprovalQuickContent row={row} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => navigate({ to: '/approvals/$requestId', params: { requestId: row.id } }),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/approvals" label="Back to Approval Center" />

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
            <ExportButton resource={ResourceName.APPROVAL} query={search} filenameStem="pending-approvals" />
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bv-surface card-hover p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-surface-container text-secondary rounded-lg material-symbols-outlined">
              pending_actions
            </span>
          </div>
          <p className="text-label-md text-on-surface-variant">Pending</p>
          <h3 className="text-headline-lg font-semibold text-on-background mt-1">{kpis.pending}</h3>
        </div>
        <div className="bv-surface card-hover p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg material-symbols-outlined">
              check_circle
            </span>
            <span className="text-label-sm text-on-surface-variant">Today</span>
          </div>
          <p className="text-label-md text-on-surface-variant">Approved Today</p>
          <h3 className="text-headline-lg font-semibold text-on-background mt-1">{kpis.approvedToday}</h3>
        </div>
        <div className="bv-surface card-hover p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-red-50 text-error rounded-lg material-symbols-outlined">cancel</span>
            <span className="text-label-sm text-on-surface-variant">Today</span>
          </div>
          <p className="text-label-md text-on-surface-variant">Rejected Today</p>
          <h3 className="text-headline-lg font-semibold text-on-background mt-1">{kpis.rejectedToday}</h3>
        </div>
        <div className="bg-secondary p-4 rounded-xl border border-outline-variant executive-shadow text-white card-hover">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-white/20 rounded-lg material-symbols-outlined">priority_high</span>
          </div>
          <p className="text-label-md opacity-80">Action Required</p>
          <h3 className="text-headline-lg font-semibold mt-1">{String(kpis.overdue).padStart(2, '0')}</h3>
        </div>
      </section>

      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-body-sm"
          placeholder="Search requests..."
          type="search"
        />
      </div>

      <section className="bv-surface overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-body-sm text-on-surface-variant">Loading…</div>
          ) : (
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
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="zebra-row cursor-pointer"
                    onClick={() => openApprovalOverview(row)}
                  >
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
                          priorityStyles[row.priority],
                        )}
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-surface-container text-secondary text-label-sm font-medium rounded-full">
                        {row.status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <button type="button" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                          <span className="material-symbols-outlined">check</span>
                        </button>
                        <button type="button" className="p-2 text-error hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                        <button
                          type="button"
                          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                          title="View"
                          onClick={() => navigate({ to: '/approvals/$requestId', params: { requestId: row.id } })}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
          <span className="text-body-sm text-on-surface-variant">
            Showing {filtered.length} of {kpis.pending} pending requests
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="p-1 border border-outline-variant rounded opacity-50" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-label-md px-2">1</span>
            <button type="button" className="p-1 border border-outline-variant rounded hover:bg-white transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
