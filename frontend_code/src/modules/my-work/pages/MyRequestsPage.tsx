import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { myRequests } from '@/modules/approvals/data/mock'
import { cn } from '@/shared/lib/cn'

const statusStyles: Record<string, string> = {
  'In-Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
}

const filters = ['All Requests', 'In-Progress', 'Approved', 'Rejected'] as const

/** My Requests — employee-submitted requests (My Work module). */
export function MyRequestsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All Requests')

  const visible =
    filter === 'All Requests'
      ? myRequests
      : myRequests.filter(
          (r) => r.status === filter || (filter === 'In-Progress' && r.status === 'Pending')
        )

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Requests"
        description="Track and manage your submitted organizational requests and their real-time statuses."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">filter_list</span>}
            >
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
            >
              Export
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="assignment"
          iconClass="bg-secondary/10 text-secondary"
          label="Total Requests"
          value={24}
          badge="+2 this week"
        />
        <StatCard
          icon="pending_actions"
          iconClass="bg-amber-100 text-amber-700"
          label="In Progress"
          value={8}
        />
        <StatCard icon="verified" iconClass="bg-blue-100 text-blue-700" label="Approved" value={12} />
        <StatCard icon="cancel" iconClass="bg-red-100 text-red-700" label="Rejected" value={4} />
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-label-md font-medium',
                  filter === f
                    ? 'bg-primary text-on-primary'
                    : 'hover:bg-surface-container-low text-on-surface-variant'
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
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Date Submitted
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Current Stage
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Assigned Approver
                </th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-container-low group cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: '/my-work/approvals/$requestId',
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
                              : 'bg-amber-500'
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
                        statusStyles[row.status] ?? statusStyles.Pending
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-surface-container rounded-lg"
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
            Showing 1 to {visible.length} of 24 entries
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
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low text-label-md"
            >
              2
            </button>
            <button
              type="button"
              className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
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
  badge,
}: {
  icon: string
  iconClass: string
  label: string
  value: number
  badge?: string
}) {
  return (
    <div className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className={cn('material-symbols-outlined p-2 rounded-lg', iconClass)}>{icon}</span>
        {badge && (
          <span className="text-label-sm text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-on-background">{value}</h3>
    </div>
  )
}
