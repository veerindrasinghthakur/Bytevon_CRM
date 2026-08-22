import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { useEmployeeDashboard } from '../hooks/use-employee-dashboard'

const card = 'bv-surface card-hover'
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

type WeekBar =
  | number
  | {
      pct: number
      isWeekend?: boolean
      breakMarkers?: { id: string; startPct: number; endPct?: number }[]
    }

export function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const { kpis, tasks, leaveSummary, meta, quickActions, isLoading } = useEmployeeDashboard()

  if (isLoading || !meta) {
    return (
      <div className="py-16 text-center text-body-sm text-on-surface-variant">Loading dashboard…</div>
    )
  }

  const displayName =
    'name' in meta ? (meta as { name: string }).name : (meta as { firstName?: string }).firstName ?? 'there'
  const weekBars = meta.weekBars as WeekBar[]

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden bg-deep-navy rounded-xl p-8 text-on-primary executive-shadow">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-headline-lg font-bold mb-2">Good Morning, {displayName}</h2>
            <div className="flex flex-wrap gap-3 text-inverse-primary">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">badge</span> {meta.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">business_center</span> {meta.department}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span> {meta.todayLabel}
              </span>
            </div>
          </div>
          <div className="bg-secondary/20 backdrop-blur-sm border border-secondary/30 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-secondary p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-secondary">schedule</span>
            </div>
            <div>
              <span className="text-label-sm opacity-80 uppercase tracking-wider">Current Shift</span>
              <p className="text-title-lg">{meta.shift}</p>
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
              onClick={() => navigate({ to: q.to })}
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
            <button
              type="button"
              className="text-secondary text-label-md font-bold hover:underline"
              onClick={() => navigate({ to: '/my-work/attendance' })}
            >
              Full Report
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-lg">
              <span className="text-label-sm text-on-surface-variant">Check-in</span>
              <p className="text-body-lg font-bold text-secondary">{meta.checkIn}</p>
              <span className="text-[10px] text-on-surface-variant">{meta.checkInNote}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg">
              <span className="text-label-sm text-on-surface-variant">Total Hours</span>
              <p className="text-body-lg font-bold text-on-background">{meta.totalHours}</p>
              <span className="text-[10px] text-on-surface-variant">{meta.totalHoursNote}</span>
            </div>
            <div className="md:col-span-2">
              <div className="h-28 flex items-end gap-2">
                {weekBars.map((bar, i) => {
                  const pct = typeof bar === 'number' ? bar : bar.pct
                  const isWeekend = typeof bar === 'object' && Boolean(bar.isWeekend)
                  const markers = typeof bar === 'object' ? (bar.breakMarkers ?? []) : []
                  const isToday = i === 4
                  const label = WEEK_LABELS[i] ?? `D${i + 1}`
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className={cn(
                          'relative w-full rounded-t-md transition-colors min-h-[4px] overflow-hidden',
                          isWeekend
                            ? 'bg-outline-variant/55'
                            : isToday
                              ? 'bg-secondary'
                              : 'bg-secondary/25 hover:bg-secondary/40',
                        )}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                        title={`${label}${isWeekend ? ' (weekend)' : ''}: ${pct}%${markers.length ? ` · ${markers.length} break(s)` : ''}`}
                      >
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
                            />
                          )
                        })}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-medium',
                          isWeekend ? 'text-on-surface-variant/70' : 'text-on-surface-variant',
                          isToday && 'text-secondary font-bold',
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-secondary/40" /> Work
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
          <button
            type="button"
            onClick={() => navigate({ to: '/my-work/tasks/new' })}
            className="px-3 py-1.5 text-label-sm bg-secondary text-on-secondary rounded-md bv-pressable"
          >
            + New Task
          </button>
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
