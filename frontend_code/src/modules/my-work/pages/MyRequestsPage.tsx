import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { queryKeys } from '@/shared/lib/query-keys'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../routes'
import { statusStyles } from '../schemas/enums'
import { listMySubmittedRequests } from '../api/my-work'

const filters = ['All Requests', 'In-Progress', 'Approved', 'Rejected'] as const

/**
 * Full table of organizational requests the employee submitted.
 * Distinct from MyApprovalsPage (`/my-work/approvals`) card summary of approval-tracked items.
 * Status: UI may show In-Progress; schema ApprovalStatus is PENDING | APPROVED | REJECTED.
 */
export function MyRequestsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All Requests')

  const requestsQuery = useQuery({
    queryKey: queryKeys.myWork.requests.list({}),
    queryFn: () => listMySubmittedRequests({}),
  })
  const myRequests = requestsQuery.data?.items ?? []

  const stats = useMemo(() => {
    const total = myRequests.length
    const inProgress = myRequests.filter(
      (r) => r.status === 'In-Progress' || r.status === 'Pending',
    ).length
    const approved = myRequests.filter((r) => r.status === 'Approved').length
    const rejected = myRequests.filter((r) => r.status === 'Rejected').length
    return { total, inProgress, approved, rejected }
  }, [myRequests])

  const visible =
    filter === 'All Requests'
      ? myRequests
      : myRequests.filter(
          (r) => r.status === filter || (filter === 'In-Progress' && r.status === 'Pending'),
        )

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Requests"
        description="Track and manage every organizational request you submitted and its status."
        actions={
          <ExportButton resource="approval_request" filenameStem="my-requests" label="Export" />
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="assignment"
          iconClass="bg-secondary/10 text-secondary"
          label="Total Requests"
          value={stats.total}
        />
        <StatCard
          icon="pending_actions"
          iconClass="bg-amber-100 text-amber-700"
          label="In Progress"
          value={stats.inProgress}
        />
        <StatCard icon="verified" iconClass="bg-blue-100 text-blue-700" label="Approved" value={stats.approved} />
        <StatCard icon="cancel" iconClass="bg-red-100 text-red-700" label="Rejected" value={stats.rejected} />
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Date Submitted
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Current Stage
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Assigned Approver
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((row) => (
                <tr
                  key={row.id}
                  className="zebra-row group cursor-pointer"
                  onClick={() =>
                    safeNavigate(navigate,{
                      to: myWorkRoutes.approvalDetail(row.id),
                      params: { requestId: row.id },
                    })
                  }
                >
                  <td className="px-6 py-5 text-label-md text-secondary font-bold">#{row.id}</td>
                  <td className="px-6 py-5 text-body-md">{row.type}</td>
                  <td className="px-6 py-5 text-body-sm text-on-surface-variant">{row.date}</td>
                  <td className="px-6 py-5">
                    <span className="flex items-center gap-2 text-body-sm text-on-background">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          row.status === 'Approved'
                            ? 'bg-emerald-500'
                            : row.status === 'Rejected'
                              ? 'bg-red-500'
                              : 'bg-amber-500',
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
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-label-sm font-medium border',
                        statusStyles[row.status] ?? statusStyles.Pending,
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-surface-container rounded-lg transition-all"
                      onClick={(e) => e.stopPropagation()}
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
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: string
  iconClass: string
  label: string
  value: number
}) {
  return (
    <div className="p-6 bv-surface card-hover">
      <div className="flex justify-between items-start mb-4">
        <span className={cn('material-symbols-outlined p-2 rounded-lg', iconClass)}>{icon}</span>
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-on-background">{value}</h3>
    </div>
  )
}