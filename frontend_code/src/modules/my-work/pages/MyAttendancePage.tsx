import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { queryKeys } from '@/shared/lib/query-keys'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../routes'

import {
  formatClockTime,
  formatHoursCompact,
  getTodayAttendance,
  getWorkHoursSummary,
  subscribeAttendanceChange,
} from '../lib/attendance-session'
import {
  breaksToBarMarkers,
  formatDuration,
  getElapsedMs,
  getTodayBreakStats,
  getTodayBreaks,
  isBreakRunning,
  subscribeBreakChange,
} from '../lib/break-session'
import {
  getMyWorkTodayInfo,
  getMyWeekHours,
  listMyAttendance,
} from '../api/my-work'
import { attendanceStatusStyles } from '../schemas/enums'
import type { BreakBarMarker, WeekHourBar } from '../types'

function WeekBar({
  d,
  markers,
}: {
  d: WeekHourBar
  markers: BreakBarMarker[]
}) {
  const height = d.pct > 0 ? `${d.pct}%` : '4px'
  return (
    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
      <div
        className={cn(
          'relative w-full rounded-t-md transition-colors overflow-hidden',
          d.isWeekend
            ? 'bg-outline-variant/50'
            : d.isToday
              ? 'bg-secondary'
              : d.pct > 0
                ? 'bg-secondary/25'
                : 'bg-outline-variant/30',
        )}
        style={{ height }}
        title={`${d.day}: ${d.hours}h${d.isWeekend ? ' (weekend)' : ''}${markers.length ? ` · ${markers.length} break(s)` : ''}`}
      >
        {/* Red break segments — one per break; multiple breaks → multiple red bands */}
        {markers.map((m) => {
          const bottom = m.startPct
          const top = m.endPct ?? m.startPct + 2
          const h = Math.max(2, top - bottom)
          return (
            <span
              key={m.id}
              className="absolute left-0 right-0 bg-error/90 rounded-[1px] pointer-events-none"
              style={{
                bottom: `${bottom}%`,
                height: `${h}%`,
                minHeight: 3,
              }}
              title="Break"
            />
          )
        })}
      </div>
      <span
        className={cn(
          'text-label-sm font-medium',
          d.isWeekend ? 'text-on-surface-variant/70' : 'text-on-surface-variant',
          d.isToday && 'text-secondary font-bold',
        )}
      >
        {d.day}
      </span>
    </div>
  )
}

export function MyAttendancePage() {
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)

  const todayInfoQuery = useQuery({
    queryKey: queryKeys.myWork.attendance.todayInfo(),
    queryFn: getMyWorkTodayInfo,
  })
  const weekHoursQuery = useQuery({
    queryKey: queryKeys.myWork.attendance.weekHours(),
    queryFn: getMyWeekHours,
  })
  const historyQuery = useQuery({
    queryKey: queryKeys.myWork.attendance.list({}),
    queryFn: () => listMyAttendance({ pageSize: 50 }),
  })

  const currentUser = todayInfoQuery.data
  const weekHours = weekHoursQuery.data ?? []
  const attendanceHistory = historyQuery.data?.items ?? []

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

  const todayBreaks = getTodayBreaks()
  const breakStats = getTodayBreakStats()

  const chartDays = useMemo(() => {
    const now = Date.now()
    return weekHours.map((d) => {
      if (!d.isToday || !session) return d
      const windowStart = new Date(session.checkInAt).getTime()
      const windowEnd = session.checkOutAt ? new Date(session.checkOutAt).getTime() : now
      const liveMarkers = breaksToBarMarkers(todayBreaks, windowStart, windowEnd, now)
      return { ...d, breakMarkers: liveMarkers }
    })
  }, [session, todayBreaks, tick])

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
              onClick={() => safeNavigate(navigate,{ to: myWorkRoutes.attendanceCorrections })}
            >
              Corrections
            </Button>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">fingerprint</span>}
              onClick={() => safeNavigate(navigate,{ to: myWorkRoutes.attendanceMark })}
            >
              Mark Attendance
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bv-surface card-hover p-5">
          <p className="text-label-sm text-on-surface-variant mb-1">Today</p>
          <p className="text-headline-md font-bold text-on-background">{currentUser?.todayLabel ?? '—'}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">Shift · {currentUser?.shift ?? '—'}</p>
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
          <p className="text-label-sm text-on-surface-variant mb-1">Breaks today</p>
          <p className="text-headline-md font-bold text-error">{breakStats.count}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            Total time · {breakStats.count ? formatHoursCompact(breakStats.totalMs) : '—'}
          </p>
        </div>
        <div className="bv-surface card-hover p-5">
          <p className="text-label-sm text-on-surface-variant mb-1">Status</p>
          <p
            className={cn(
              'text-headline-md font-bold',
              session && !session.checkOutAt ? 'text-emerald-700' : 'text-on-background',
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
          {chartDays.map((d) => (
            <WeekBar key={d.day} d={d} markers={d.breakMarkers ?? []} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-label-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-secondary/40" /> Work hours
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-error/90" /> Break (red band — one per break)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-outline-variant/50" /> Weekend
          </span>
        </div>
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between gap-3">
          <div>
            <h3 className="text-title-lg font-semibold text-on-background">Today’s breaks</h3>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Every break taken today — countdown only notifies; duration runs until you end it.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">coffee</span>}
            onClick={() => safeNavigate(navigate,{ to: myWorkRoutes.break })}
          >
            Take a break
          </Button>
        </div>
        {todayBreaks.length === 0 ? (
          <p className="p-8 text-body-md text-on-surface-variant text-center">No breaks taken today.</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {todayBreaks.map((b) => {
              const running = isBreakRunning(b)
              const ms = getElapsedMs(b)
              return (
                <li key={b.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div className="min-w-0">
                    <p className="text-body-md font-semibold text-on-background flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                      {formatClockTime(b.startedAt)}
                      {b.endedAt ? ` – ${formatClockTime(b.endedAt)}` : ' – ongoing'}
                    </p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      {b.mode === 'countdown' && b.durationMinutes
                        ? `Planned ${b.durationMinutes} min · actual ${formatDuration(ms)}`
                        : `Stopwatch · ${formatDuration(ms)}`}
                      {b.note ? ` · ${b.note}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-semibold',
                      running ? 'bg-error/10 text-error' : 'bg-surface-container-high text-on-surface-variant',
                    )}
                  >
                    {running ? 'In progress' : 'Completed'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
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
                    safeNavigate(navigate,{
                      to: myWorkRoutes.attendanceDetail(row.id),
                    })
                  }
                >
                  <td className="px-6 py-4 text-label-md font-medium text-secondary">{row.date}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.checkIn ?? '—'}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.checkOut ?? '—'}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.totalHours ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${attendanceStatusStyles[row.status] ?? ''}`}
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
