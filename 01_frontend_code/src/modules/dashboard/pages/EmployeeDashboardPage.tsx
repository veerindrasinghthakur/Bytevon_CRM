import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { useEmployeeDashboard } from '../hooks/use-employee-dashboard'
import { useWeekBars } from '../hooks/use-week-bars'
import { WEEK_LABELS } from '../calendar'

const card = 'bv-surface card-hover'

type BreakMarker = {
  id: string
  startPct: number
  endPct?: number
}

type WeekBarData =
  | number
  | {
      pct: number
      isWeekend?: boolean
      breakMarkers?: BreakMarker[]
    }

type EmployeeMeta = {
  name: string
  employeeId: string
  department: string
  todayLabel: string
  shift: string
  checkIn: string
  checkInNote: string
  totalHours: string
  totalHoursNote: string
  weekBars: WeekBarData[]
}

export function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const { kpis, tasks, leaveSummary, meta, quickActions, isLoading, isError, error, refetch } =
    useEmployeeDashboard()
  const typedMeta = meta as EmployeeMeta | undefined
  // Monday-first index for the current day (backend weekBars are Mon..Sun).
  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, [])
  const { weekBarElements } = useWeekBars({ weekBars: typedMeta?.weekBars ?? [], todayIndex })
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  if (isError) {
    return (
      <div className="py-16">
        <ErrorState
          title="Could not load dashboard"
          description={getApiErrorMessage(error, 'We could not load the dashboard data.')}
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  if (isLoading || !meta || !typedMeta) {
    return (
      <div className="py-16 text-center text-body-sm text-on-surface-variant">Loading dashboard…</div>
    )
  }

  const displayName = typedMeta.name ?? 'there'

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden bg-deep-navy rounded-xl p-8 text-on-primary executive-shadow">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-headline-lg font-bold mb-2">{greeting}, {displayName}</h2>
            <div className="flex flex-wrap gap-3 text-inverse-primary">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">badge</span> {typedMeta.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">business_center</span> {typedMeta.department}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span> {typedMeta.todayLabel}
              </span>
            </div>
          </div>
          <div className="bg-secondary/20 backdrop-blur-sm border border-secondary/30 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-secondary p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-secondary">schedule</span>
            </div>
            <div>
              <span className="text-label-sm opacity-80 uppercase tracking-wider">Current Shift</span>
              <p className="text-title-lg">{typedMeta.shift}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-title-lg text-on-background mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => safeNavigate(navigate, { to: q.to })}
              className="bv-action-tile group"
            >
              <span className="material-symbols-outlined text-[32px] text-secondary mb-3 bv-action-icon">
                {q.icon}
              </span>
              <span className="text-label-md font-bold text-on-surface">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
              <span className={`material-symbols-outlined text-[18px] ${k.color}`}>{k.icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-headline-md font-bold text-on-background">{k.value}</span>
              <span className="text-[10px] text-on-surface-variant">{k.note}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${card} lg:col-span-2 p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg text-on-background">Attendance Overview</h3>
            <Can action={Action.VIEW} resource={'attendance'}>
              <button
                type="button"
                className="text-secondary text-label-md font-bold hover:underline"
                onClick={() => safeNavigate(navigate, { to: '/my-work/attendance' })}
              >
                Full Report
              </button>
            </Can>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-lg">
              <span className="text-label-sm text-on-surface-variant">Check-in</span>
              <p className="text-body-lg font-bold text-secondary">{typedMeta.checkIn}</p>
              <span className="text-[10px] text-on-surface-variant">{typedMeta.checkInNote}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg">
              <span className="text-label-sm text-on-surface-variant">Total Hours</span>
              <p className="text-body-lg font-bold text-on-background">{typedMeta.totalHours}</p>
              <span className="text-[10px] text-on-surface-variant">{typedMeta.totalHoursNote}</span>
            </div>
            <div className="md:col-span-2">
              <div className="h-28 flex items-end gap-2">
                {weekBarElements}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-secondary/60" /> Work
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-error/90" /> Break (red)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-outline-variant/55" /> Weekend
            </span>
          </div>
        </div>

        <div className={`${card} p-6 flex flex-col gap-4`}>
          <h3 className="text-title-lg text-on-background">Leave Summary</h3>
          {leaveSummary.map((l) => (
            <div
              key={l.name}
              className={`bg-surface-container-low p-4 rounded-lg flex items-center justify-between border-l-4 ${l.border}`}
            >
              <div>
                <span className="text-label-md font-bold text-on-surface">{l.name}</span>
                <p className="text-label-sm text-on-surface-variant">{l.used}</p>
              </div>
              <div className="text-right">
                <span className={`text-body-lg font-bold ${l.color}`}>{l.left}</span>
                <p className="text-label-sm text-on-surface-variant">left</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${card} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg text-on-background">Assigned Tasks</h3>
          <Can action={Action.CREATE} resource={'task'}>
            <button
              type="button"
              onClick={() => safeNavigate(navigate, { to: '/my-work/tasks/new' })}
              className="px-3 py-1.5 text-label-sm bg-secondary text-on-secondary rounded-md bv-pressable"
            >
              + New Task
            </button>
          </Can>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Task Name</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Est. Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {tasks.map((t) => (
                <tr key={t.name} className="zebra-row group">
                  <td className="px-6 py-4 font-semibold text-on-surface">{t.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        t.priority === 'High'
                          ? 'bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full text-label-sm font-bold'
                          : 'bg-surface-container-highest text-on-surface-variant px-2.5 py-0.5 rounded-full text-label-sm'
                      }
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{t.due}</td>
                  <td className="px-6 py-4 text-label-md">{t.status}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{t.est}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}