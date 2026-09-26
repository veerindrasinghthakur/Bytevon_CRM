import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useApprovalCenter } from '../hooks/use-approval-center'
import { ApprovalCenterKpis } from '../components/approval-center-kpis'
import { ApprovalCenterTable } from '../components/approval-center-table'
import { approvalRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { ExportButton } from '@/shared/components/export/ExportButton'
import {
  approvalStatusOptions,
  approvalTypeOptions,
} from '../lib/approval-enums'

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

      <ApprovalCenterKpis kpis={kpis} onPendingClick={goPending} />

      <ApprovalCenterTable
        rows={rows}
        onRowClick={goPending}
        header={
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
        }
      />
    </div>
  )
}
