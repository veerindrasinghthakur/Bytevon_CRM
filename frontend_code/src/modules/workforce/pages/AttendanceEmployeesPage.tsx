import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { cn } from '@/shared/lib/cn'
import { todayAttendance } from '../data/attendanceMock'
import { RouteCrumbs } from '../components/RouteCrumbs'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

const statusClass: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800',
  LATE: 'bg-amber-100 text-amber-800',
  ABSENT: 'bg-rose-100 text-rose-800',
  WFH: 'bg-violet-100 text-violet-800',
  ON_LEAVE: 'bg-sky-100 text-sky-800',
}

export function AttendanceEmployeesPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(
    () =>
      todayAttendance.filter((r) => {
        const q =
          !query ||
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.department.toLowerCase().includes(query.toLowerCase())
        const s = status === 'all' || r.status === status
        return q && s
      }),
    [query, status],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="All employees attendance"
        description="View and manage real-time attendance records for the entire organisation."
        showBack
        backTo="/workforce/attendance"
        backLabel="Back to attendance"
        breadcrumbs={
          <RouteCrumbs
            items={[
              { label: 'Workforce', to: '/workforce/employees' },
              { label: 'Attendance', to: '/workforce/attendance' },
              { label: 'All employees' },
            ]}
          />
        }
      />

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm"
              placeholder="Search employee or department…"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm"
          >
            <option value="all">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
            <option value="WFH">WFH</option>
            <option value="ON_LEAVE">On leave</option>
          </select>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Employee</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">
                Department
              </th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Check in</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase hidden md:table-cell">
                Check out
              </th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-surface-container-low/50 cursor-pointer"
                onClick={() =>
                  navigate({ to: '/workforce/attendance/$attendanceId', params: { attendanceId: r.id } })
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
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', statusClass[r.status])}>
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
        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-body-sm text-on-surface-variant">No records match your filters.</div>
        )}
      </div>
    </div>
  )
}
