import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { useMyApprovals } from '../hooks/use-my-approvals'
import type { ApprovalStatus } from '../types'
import { cn } from '@/shared/lib/cn'

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

/**
 * Card view of approval-tracked items the employee submitted (leave, corrections, expense).
 * Distinct from MyRequestsPage (`/my-work/requests`) which is the full table of org requests.
 */
export function MyApprovalsPage() {
  const navigate = useNavigate()
  const {
    approvals,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtersActive,
    resetFilters,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useMyApprovals()

  const pending = approvals.filter((a) => a.status === 'Pending').length
  const approved = approvals.filter((a) => a.status === 'Approved').length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Approvals"
        description="Leave, attendance corrections, and other items you submitted for approval."
        actions={
          <ExportButton
            resource="APPROVAL"
            filters={{ status: statusFilter !== 'All' ? statusFilter : undefined }}
            query={search || undefined}
            filenameStem="my-approvals"
          />
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          className={cn(
            'bv-surface card-hover p-5 cursor-pointer text-left w-full',
            statusFilter === 'Pending' && 'ring-1 ring-secondary/30 border-secondary',
          )}
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
        >
          <p className="text-label-sm text-on-surface-variant mb-1">Pending</p>
          <p className="text-headline-md font-bold text-amber-600">{pending}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">Awaiting decision</p>
        </button>
        <button
          type="button"
          className={cn(
            'bv-surface card-hover p-5 cursor-pointer text-left w-full',
            statusFilter === 'Approved' && 'ring-1 ring-secondary/30 border-secondary',
          )}
          onClick={() => setStatusFilter(statusFilter === 'Approved' ? 'All' : 'Approved')}
        >
          <p className="text-label-sm text-on-surface-variant mb-1">Approved</p>
          <p className="text-headline-md font-bold text-emerald-600">{approved}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">This period</p>
        </button>
      </section>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search approvals…"
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All status"
          options={[
            { value: 'All', label: 'All status' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Rejected', label: 'Rejected' },
          ]}
          minWidthClass="min-w-[140px]"
        />
      </ListToolbar>

      {isError && (
        <p className="text-body-md text-error text-center py-8">Could not load approvals. Retry or go back.</p>
      )}

      <section className="space-y-3">
        {(isLoading || isFetching) && (
          <p className="text-body-md text-on-surface-variant py-8 text-center">Loading…</p>
        )}
        {approvals.length === 0 && !isLoading && !isFetching && (
          <p className="text-body-md text-on-surface-variant py-8 text-center">
            No approvals found.
          </p>
        )}
        {approvals.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              navigate({ to: '/my-work/approvals/$requestId', params: { requestId: item.id } })
            }
            className="w-full text-left bv-surface card-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4"
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
            <span className="text-label-md font-medium text-secondary shrink-0">View details</span>
          </button>
        ))}
      </section>
    </div>
  )
}