import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { myApprovals } from '../data/mock'
import type { ApprovalStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const statusStyles: Record<ApprovalStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
}

const filters = ['All', 'Pending', 'Approved', 'Rejected'] as const

/** My Requests — employee-submitted requests (My Work module). */
export function MyRequestsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const counts = useMemo(() => {
    return {
      total: myApprovals.length,
      pending: myApprovals.filter((a) => a.status === 'Pending').length,
      approved: myApprovals.filter((a) => a.status === 'Approved').length,
      rejected: myApprovals.filter((a) => a.status === 'Rejected').length,
    }
  }, [])

  const visible = useMemo(() => {
    if (filter === 'All') return myApprovals
    return myApprovals.filter((a) => a.status === filter)
  }, [filter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Requests"
        description="Track leave, attendance corrections, and other requests you submitted."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">filter_list</span>}>
              Filter
            </Button>
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>
              Export
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Total" value={counts.total} icon="assignment" iconClass="bg-secondary/10 text-secondary" />
        <Stat label="Pending" value={counts.pending} icon="pending_actions" iconClass="bg-amber-100 text-amber-700" />
        <Stat label="Approved" value={counts.approved} icon="verified" iconClass="bg-emerald-100 text-emerald-700" />
        <Stat label="Rejected" value={counts.rejected} icon="cancel" iconClass="bg-red-100 text-red-700" />
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-label-md font-medium',
                filter === f ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low text-on-surface-variant'
              )}
            >
              {f === 'All' ? 'All Requests' : f}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Request</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface-container-low cursor-pointer"
                  onClick={() =>
                    navigate({ to: '/my-work/approvals/$requestId', params: { requestId: item.id } })
                  }
                >
                  <td className="px-6 py-4 text-label-md font-semibold text-on-background">{item.title}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{item.type}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{item.submittedOn}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-label-sm font-medium border',
                        statusStyles[item.status]
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-label-md text-secondary font-medium">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string
  value: number
  icon: string
  iconClass: string
}) {
  return (
    <div className="p-5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <span className={cn('material-symbols-outlined p-2 rounded-lg', iconClass)}>{icon}</span>
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-on-background">{value}</h3>
    </div>
  )
}
