import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { ApprovalQuickContent } from '../components/approval-quick-content'
import { PendingApprovalsKpis } from '../components/pending-approvals-kpis'
import { PendingApprovalsTable } from '../components/pending-approvals-table'
import { usePendingApprovals } from '../hooks/use-pending-approvals'
import { useApprovalCenter } from '../hooks/use-approval-center'
import type { ApprovalRow } from '../types/request.types'
import {
  approvalPriorityDot,
  approvalPriorityFilterOptions,
} from '../lib/approval-enums'
import { approvalRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'

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
            <ExportButton resource={'approval'} query={search} filenameStem="pending-approvals" />
          </div>
        }
      />

      <PendingApprovalsKpis kpis={kpis} />

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

      <PendingApprovalsTable
        filtered={filtered}
        pendingTotal={kpis.pending}
        isLoading={isLoading}
        isFetching={isFetching}
        onOpenRow={openApprovalOverview}
      />
    </div>
  )
}
