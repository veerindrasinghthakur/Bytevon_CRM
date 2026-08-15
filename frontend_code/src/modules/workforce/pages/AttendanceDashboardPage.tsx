import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import {
  attendanceKpis,
  weeklyAttendance,
  recentCheckIns,
  todayAttendance,
  corrections,
} from '../data/attendanceMock'

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
  'On Time': 'bg-emerald-100 text-emerald-800',
  Late: 'bg-amber-100 text-amber-800',
  Remote: 'bg-violet-100 text-violet-800',
}

export function AttendanceDashboardPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const maxBar = Math.max(...weeklyAttendance.map((d) => Math.max(d.thisWeek, d.lastWeek)), 1)

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return todayAttendance.filter(
      (r) => !q || r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Dashboard"
        description="Real-time monitoring of your organisation's workforce status."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<Icon name="groups" />}
              onClick={() => navigate({ to: '/workforce/attendance/employees' })}
            >
              All employees
            </Button>
            <Button
              variant="primary"
              leftIcon={<Icon name="how_to_reg" />}
              onClick={() => navigate({ to: '/my-work/attendance/mark' })}
            >
              Mark attendance
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {attendanceKpis.map((k) => (
          <div
            key={k.key}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm"
          >
            <div className="flex justify-between mb-2">
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Icon name={k.icon} className="text-lg" />
              </div>
            </div>
            <div className="text-headline-xl font-bold">{k.value.toLocaleString()}</div>
            <p className="text-caption text-on-surface-variant mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-title-md font-semibold text-on-background">Weekly attendance</h2>
              <p className="text-caption text-on-surface-variant">Avg. rate: 86.4%</p>
            </div>
            <div className="flex gap-3 text-caption text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary" /> This week
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-outline-variant" /> Last week
              </span>
            </div>
          </div>
          <div className="flex h-40 items-end gap-3">
            {weeklyAttendance.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t bg-outline-variant/60"
                    style={{ height: `${(d.lastWeek / maxBar) * 100}%` }}
                  />
                  <div
                    className="w-2.5 rounded-t bg-secondary"
                    style={{ height: `${(d.thisWeek / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-on-surface-variant">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-title-md font-semibold">Recent check-ins</h2>
            <Link to="/workforce/attendance/employees" className="text-label-sm text-secondary hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {recentCheckIns.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-body-sm font-medium text-on-background">{c.name}</p>
                  <p className="text-caption text-on-surface-variant">
                    {c.team} · {c.time}
                  </p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', statusClass[c.status])}>
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/30 flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-title-md font-semibold">Today's attendance</h2>
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm"
                placeholder="Search…"
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Employee</th>
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">
                  Department
                </th>
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Check in</th>
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-surface-container-low/50 cursor-pointer"
                  onClick={() =>
                    navigate({ to: '/workforce/attendance/$attendanceId', params: { attendanceId: r.id } })
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                        {r.avatar}
                      </div>
                      <span className="font-medium text-body-sm">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant hidden sm:table-cell">{r.department}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{r.checkIn}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', statusClass[r.status])}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-title-md font-semibold">Corrections</h2>
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
              {corrections.length} pending
            </span>
          </div>
          <ul className="space-y-4">
            {corrections.map((c) => (
              <li key={c.id} className="rounded-lg border border-outline-variant/40 bg-surface-container-low/40 p-3">
                <div className="flex justify-between gap-2">
                  <span className="text-body-sm font-medium">{c.name}</span>
                  <span className="text-caption text-on-surface-variant">{c.ago}</span>
                </div>
                <p className="text-caption text-on-surface-variant mt-1">"{c.note}"</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="primary" className="!py-1 !px-2 !text-[11px]">
                    Approve
                  </Button>
                  <Button variant="outline" className="!py-1 !px-2 !text-[11px]">
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/my-work/attendance/corrections"
            className="mt-4 inline-block text-label-sm text-secondary hover:underline"
          >
            View correction history
          </Link>
        </section>
      </div>
    </div>
  )
}
