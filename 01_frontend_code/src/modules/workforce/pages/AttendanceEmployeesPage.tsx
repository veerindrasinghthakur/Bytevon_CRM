import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Select } from '@/shared/components/ui/Select'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { workforceRoutes } from '../routes'
import {
  workforceAttendanceStatusStyles,
  WORKFORCE_ATTENDANCE_STATUS_OPTIONS,
} from '../schemas/enums'
import { useTodayAttendance } from '../hooks/use-attendance'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function AttendanceEmployeesPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const { data, isLoading, isError, error, refetch } = useTodayAttendance({
    search: query || undefined,
    status: status === 'ALL' ? undefined : status,
  })

  const filtered = useMemo(() => data?.items ?? [], [data?.items])

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return (
      <ErrorState
        description={error instanceof Error ? error.message : 'Failed to load attendance'}
        onRetry={() => refetch()}
        onBack={() => safeNavigate(navigate, { to: workforceRoutes.attendance })}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="All employees attendance"
        description="View and manage real-time attendance records for the entire organisation."
        showBack
        backTo={workforceRoutes.attendance}
        backLabel="Back to attendance"
        breadcrumbs={
          <DynamicRouteCrumbs
            lastLabel="All employees"
            labelOverrides={{ employees: 'All employees' }}
          />
        }
      />

      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
              placeholder="Search employee or department…"
            />
          </div>
          <Select
            value={status}
            onChange={setStatus}
            options={[...WORKFORCE_ATTENDANCE_STATUS_OPTIONS]}
            minWidthClass="min-w-[140px]"
            aria-label="Filter by status"
          />
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Employee</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">Department</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Check in</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase hidden md:table-cell">Check out</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="zebra-row cursor-pointer"
                onClick={() =>
                  safeNavigate(navigate, {
                    to: workforceRoutes.attendanceRecordPath,
                    params: { attendanceId: r.id },
                  })
                }
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                      {r.avatar}
                    </div>
                    <span className="font-semibold text-body-sm">{r.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant hidden sm:table-cell">{r.department}</td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant">{r.checkIn}</td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant hidden md:table-cell">{r.checkOut}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      workforceAttendanceStatusStyles[r.status] ?? 'status-badge status-neutral',
                    )}
                  >
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Icon name="chevron_right" className="text-on-surface-variant" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-body-sm text-on-surface-variant">
            No records match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
