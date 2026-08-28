import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { ApprovalQuickContent } from '../components/ApprovalQuickContent'
import { ResourceName } from '@/shared/schema'
import { usePendingApprovals } from '../hooks/use-pending-approvals'
import { useApprovalCenter } from '../hooks/use-approval-center'
import type { ApprovalRow, ApprovalPriority } from '../types'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

const priorityStyles: Record<ApprovalPriority, string> = {
  High: 'status-badge status-error',
  Medium: 'status-badge status-warning',
  Normal: 'status-badge status-info',
  Low: 'status-badge status-neutral',
}

const priorityDot: Record<ApprovalPriority, string> = {
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Normal: 'bg-blue-500',
  Low: 'bg-slate-400',
}

export function PendingApprovalsPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    filtered,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    priorityFilter,
    setPriorityFilter,
    types,
    filtersActive,
    resetFilters,
    isLoading,
    isFetching,
    refetch,
  } = usePendingApprovals()
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
      onOpenFull: () => safeNavigate(navigate, { to: '/approvals/$requestId', params: { requestId: row.id } }),
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

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search requests..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All types"
          options={[
            { value: 'All', label: 'All types' },
            ...types.map((t) => ({ value: t, label: t })),
          ]}
          minWidthClass="min-w-[140px]"
        />
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          placeholder="All priority"
          options={[
            { value: 'All', label: 'All priority' },
            { value: 'High', label: 'High' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Normal', label: 'Normal' },
            { value: 'Low', label: 'Low' },
          ]}
          minWidthClass="min-w-[130px]"
        />
      </ListToolbar>

      <section className="bv-surface overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
            <TableSkeleton rows={5} />
          </div>
        )}
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
                    <span className={priorityStyles[row.priority] ?? 'status-badge status-neutral'}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="status-badge status-info">{row.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <RowActions
                        label={`Actions for request ${row.id}`}
                        actions={[
                          {
                            id: 'overview',
                            label: 'Quick view',
                            icon: 'visibility',
                            onClick: () => openApprovalOverview(row),
                          },
                          {
                            id: 'details',
                            label: 'View details',
                            icon: 'description',
                            onClick: () =>
                              safeNavigate(navigate, {
                                to: '/approvals/$requestId',
                                params: { requestId: row.id },
                              }),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
          <span className="text-body-sm text-on-surface-variant">
            Showing {filtered.length} of {kpis.pending} pending requests
          </span>
        </div>
      </section>
    </div>
  )
}
