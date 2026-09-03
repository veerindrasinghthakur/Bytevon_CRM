import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { ApprovalQuickContent } from '../components/ApprovalQuickContent'
import { ResourceName } from '@/shared/schema'
import { usePendingApprovals } from '../hooks/use-pending-approvals'
import { useApprovalCenter } from '../hooks/use-approval-center'
import type { ApprovalRow, ApprovalPriority } from '../types'
import {
  approvalPriorityDot,
  approvalPriorityFilterOptions,
  approvalPriorityStyles,
} from '../enums'
import { approvalRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

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

  const goDetail = (requestId: string) =>
    safeNavigate(navigate, {
      to: approvalRoutes.detailPath,
      params: { requestId },
    })

  const openApprovalOverview = (row: ApprovalRow) => {
    openPanel({
      title: row.type,
      subtitle: `#${row.id} · ${row.requester}`,
      icon: row.typeIcon || 'pending_actions',
      status: row.status,
      statusDotClass: approvalPriorityDot[row.priority] ?? 'bg-secondary',
      content: <ApprovalQuickContent row={row} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goDetail(row.id),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={approvalRoutes.center} label="Back to Approval Center" />

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
        <MetricCard icon="pending_actions" label="Pending" value={String(kpis.pending)} />
        <MetricCard
          icon="check_circle"
          label="Approved Today"
          value={String(kpis.approvedToday)}
          hint="Today"
          valueClassName="text-secondary"
        />
        <MetricCard
          icon="cancel"
          label="Rejected Today"
          value={String(kpis.rejectedToday)}
          hint="Today"
          valueClassName="text-error"
        />
        <MetricCard
          icon="priority_high"
          label="Action Required"
          value={String(kpis.overdue).padStart(2, '0')}
          className="bg-secondary text-on-secondary border-secondary"
        />
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
          options={approvalPriorityFilterOptions}
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
                      <span className={cn('p-1.5 rounded-md material-symbols-outlined text-[18px] bg-secondary/10 text-secondary')}>
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
                    <span className={approvalPriorityStyles[row.priority] ?? 'status-badge status-neutral'}>
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
                            onClick: () => goDetail(row.id),
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
