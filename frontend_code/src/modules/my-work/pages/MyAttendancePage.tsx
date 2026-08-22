import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import {
  formatClockTime,
  formatHoursCompact,
  getTodayAttendance,
  getWorkHoursSummary,
  subscribeAttendanceChange,
} from '../lib/attendance-session'
import { subscribeBreakChange } from '../lib/break-session'
import { currentUser, attendanceHistory, weekHours } from '../data/mock'
import type { AttendanceStatus } from '../types'

const statusStyles: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-50 text-emerald-700',
  Absent: 'bg-red-50 text-red-700',
  'Half Day': 'bg-amber-50 text-amber-800',
  'On Leave': 'bg-blue-50 text-blue-700',
  Holiday: 'bg-violet-50 text-violet-700',
  Weekend: 'bg-surface-container text-on-surface-variant',
}

export function MyAttendancePage() {
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1)
    const id = window.setInterval(refresh, 1000)
    const u1 = subscribeAttendanceChange(refresh)
    const u2 = subscribeBreakChange(refresh)
    return () => {
      window.clearInterval(id)
      u1()
      u2()
    }
  }, [])

  void tick
  const session = getTodayAttendance()
  const summary = getWorkHoursSummary()
  const checkInLabel = session ? formatClockTime(session.checkInAt) : '—'
  const hoursLabel = summary ? formatHoursCompact(summary.netMs) : '—'
  const statusLabel = session ? (session.checkOutAt ? 'Checked out' : 'Present') : 'Not checked in'

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Attendance"
        description="Mark attendance, review daily hours, and track history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              leftIcon={<span className="material-symbols-outlined text-lg">edit_calendar</span>}
              variant="outline"
              onClick={() => navigate({ to: '/my-work/attendance/corrections' })}
            >
              Corrections
            </Button>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">fingerprint</span>}
              onClick={() => navigate({ to: '/my-work/attendance/mark' })}
            >
              Mark Attendance
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bv-surface card-hover p-5">
          <p className="text-label-sm text-on-surface-variant mb-1">Today</p>
          <p className="text-headline-md font-bold text-on-background">{currentUser.todayLabel}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">Shift · {currentUser.shift}</p>
        </div>
        <div className="bv-surface card-hover p-5">
          <p className="text-label-sm text-on-surface-variant mb-1">Check-in</p>
          <p className="text-headline-md font-bold text-secondary">{checkInLabel}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            {session ? 'Exact punch time' : 'Not checked in yet'}
          </p>
        </div>
        <div className="bv-surface card-hover p-5">
          <p className="text-label-sm text-on-surface-variant mb-1">Hours today (net)</p>
          <p className="text-headline-md font-bold text-on-background">{hoursLabel}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            {summary ? `Break ${formatHoursCompact(summary.breakMs)} excluded` : '—'}
          </p>
        </div>
        <div className="bv-surface card-hover p-5">
          <p className="text-label-sm text-on-surface-variant mb-1">Status</p>
          <p
            className={cn(
              'text-headline-md font-bold',
              session && !session.checkOutAt ? 'text-emerald-600' : 'text-on-background',
            )}
          >
            {statusLabel}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            {session && !session.checkOutAt ? 'Live session open' : '—'}
          </p>
        </div>
      </section>

      <section className="bv-surface p-6">
        <h3 className="text-title-lg font-semibold text-on-background mb-4">This week</h3>
        <div className="flex items-end gap-3 h-32">
          {weekHours.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={cn(
                  'w-full rounded-t-md transition-colors',
                  d.isWeekend
                    ? 'bg-outline-variant/50'
                    : d.isToday
                      ? 'bg-secondary'
                      : d.pct > 0
                        ? 'bg-secondary/25'
                        : 'bg-outline-variant/30',
                )}
                style={{ height: d.pct > 0 ? `${d.pct}%` : '4px' }}
                title={`${d.day}: ${d.hours}h${d.isWeekend ? ' (weekend)' : ''}`}
              />
              <span
                className={cn(
                  'text-label-sm font-medium',
                  d.isWeekend ? 'text-on-surface-variant/70' : 'text-on-surface-variant',
                )}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>
        <p className="text-label-sm text-on-surface-variant mt-3">
          Weekends use a muted bar color. Data from weekly summary (mock → API).
        </p>
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-title-lg font-semibold text-on-background">Attendance history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Check-in</th>
                <th className="px-6 py-3 font-semibold">Check-out</th>
                <th className="px-6 py-3 font-semibold">Hours</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {attendanceHistory.map((row) => (
                <tr
                  key={row.id}
                  className="zebra-row cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: '/my-work/attendance/$attendanceId',
                      params: { attendanceId: row.id },
                    })
                  }
                >
                  <td className="px-6 py-4 text-label-md font-medium text-secondary">{row.date}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.checkIn ?? '—'}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.checkOut ?? '—'}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.totalHours ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${statusStyles[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
