import { PageHeader } from '@/shared/components/layout/PageHeader'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { useMyRequests } from '../hooks/use-my-requests'
import { cn } from '@/shared/lib/cn'
import type { ApprovalStatus } from '../types'

/** Status pills — semantic status-badge tokens only (no raw palette classes). */
const statusStyles: Record<ApprovalStatus, string> = {
  'In-Progress': 'status-badge status-warning',
  Approved: 'status-badge status-success',
  Rejected: 'status-badge status-error',
  Pending: 'status-badge status-warning',
}

const statusDot: Record<ApprovalStatus, string> = {
  'In-Progress': 'bg-[var(--color-warning-amber)]',
  Approved: 'bg-secondary',
  Rejected: 'bg-error',
  Pending: 'bg-[var(--color-warning-amber)]',
}

const filters = ['All Requests', 'In-Progress', 'Approved', 'Rejected'] as const

export function MyRequestsPage() {
  const {
    items,
    filtered,
    statusFilter,
    setStatusFilter,
  } = useMyRequests()

  const filter =
    statusFilter === 'All' || !statusFilter
      ? 'All Requests'
      : (statusFilter as (typeof filters)[number])

  const visible =
    filter === 'All Requests'
      ? filtered
      : filtered.filter(
          (r) => r.status === filter || (filter === 'In-Progress' && r.status === 'Pending'),
        )

  const stats = {
    total: items.length,
    inProgress: items.filter((r) => r.status === 'In-Progress' || r.status === 'Pending').length,
    approved: items.filter((r) => r.status === 'Approved').length,
    rejected: items.filter((r) => r.status === 'Rejected').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Requests"
        description="Track and manage your submitted organizational requests and their real-time statuses."
        actions={
          <div className="flex flex-wrap gap-2">
            <ExportButton
              resource={ResourceName.APPROVAL}
              filters={{ status: filter }}
              filenameStem="my-requests"
            />
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Total Requests" value={stats.total} icon="assignment" hint="+2 this week" />
        <MetricCard label="In Progress" value={stats.inProgress} icon="pending_actions" />
        <MetricCard label="Approved" value={stats.approved} icon="verified" valueClassName="text-secondary" />
        <MetricCard label="Rejected" value={stats.rejected} icon="cancel" valueClassName="text-error" />
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f === 'All Requests' ? 'All' : f)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-label-md font-medium transition-colors',
                  filter === f
                    ? 'bg-primary text-on-primary'
                    : 'hover:bg-surface-container-low text-on-surface-variant',
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="text-secondary text-label-md flex items-center gap-1 hover:underline"
          >
            View Archive <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Request ID</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Date Submitted</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Current Stage</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Assigned Approver</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((row) => (
                <tr key={row.id} className="zebra-row group">
                  <td className="px-6 py-5 text-label-md text-secondary font-bold">#{row.id}</td>
                  <td className="px-6 py-5 text-body-md">{row.type}</td>
                  <td className="px-6 py-5 text-body-sm text-on-surface-variant">{row.date}</td>
                  <td className="px-6 py-5">
                    <span className="flex items-center gap-2 text-body-sm text-on-background">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          statusDot[row.status] ?? statusDot.Pending,
                        )}
                      />
                      {row.stage ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-label-sm font-bold text-secondary">
                        {(row.approver ?? '?')
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <span className="text-label-md text-on-background">{row.approver ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(statusStyles[row.status] ?? statusStyles.Pending)}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-surface-container rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
          <p className="text-body-sm text-on-surface-variant">
            Showing 1 to {visible.length} of {stats.total} entries
          </p>
          <div className="flex gap-2">
            <button type="button" className="p-2 border border-outline-variant rounded-lg opacity-50" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary text-label-md">
              1
            </span>
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low text-label-md transition-colors"
            >
              2
            </button>
            <button
              type="button"
              className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
