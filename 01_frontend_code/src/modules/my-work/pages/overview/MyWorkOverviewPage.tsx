import { useNavigate } from '@tanstack/react-router'
import { useMyWorkOverview } from '../../hooks/use-my-work-overview'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../../routes'
import { priorityClass, statusDot } from '../../schemas/enums'
import type { MyTask } from '../../types'

export function MyWorkOverviewPage() {
  const {
    data,
    isLoading,
    isError,
    todayAttendance,
    weekHours,
    leaveBalances,
    metrics: myWorkMetrics,
    tasks: myTasks,
    notifications: recentNotifications,
    events: upcomingEvents,
  } = useMyWorkOverview()
  const navigate = useNavigate()

  const myWorkQuickActions = [
    { label: 'Apply Leave', to: myWorkRoutes.leaveApply, icon: 'event_available' },
    { label: 'Mark Attendance', to: myWorkRoutes.attendanceMark, icon: 'calendar_today' },
    { label: 'View Tasks', to: myWorkRoutes.tasks, icon: 'task_alt' },
    { label: 'Request Approval', to: myWorkRoutes.requests, icon: 'approval' },
    { label: 'Update Bank Details', to: myWorkRoutes.root, icon: 'account_balance' },
  ]

  if (isLoading || isError) {
    return (
      <div className="animate-fade-in">
        <div className="h-96 flex items-center justify-center bg-surface-container-lowest text-on-surface-variant">
          {isLoading ? 'Loading...' : 'Error loading data. Retry?'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1440px] animate-fade-in">
      <section className="relative overflow-hidden bg-deep-navy rounded-xl p-8 text-on-primary executive-shadow">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-headline-md md:text-headline-lg font-bold tracking-tight mb-3">
              Good Morning, {data?.user?.name ?? 'User'}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-inverse-primary">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">badge</span>
                {data?.user?.employeeId ?? 'EMP-001'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">business_center</span>
                {data?.user?.department ?? 'Engineering'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">calendar_month</span>
                {data?.user?.todayLabel ?? 'Today'}
              </span>
            </div>
          </div>
          <div className="bg-secondary/20 border border-secondary/40 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-secondary p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-secondary" aria-hidden="true">schedule</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-inverse-primary">Current Shift</span>
              <span className="text-title-lg font-semibold text-on-primary">{data?.user?.shift ?? 'Hybrid'}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-title-lg font-semibold text-on-background mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {myWorkQuickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => safeNavigate(navigate, { to: action.to })}
              className="bv-action-tile group"
            >
              <span className="material-symbols-outlined text-[32px] text-secondary mb-3 bv-action-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span className="text-label-md font-semibold text-on-background">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {myWorkMetrics.map((m) => (
          <div key={m.id} className="bv-surface card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">{m.label}</span>
              <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">{m.icon}</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-headline-md font-bold text-on-background">{m.value}</span>
              {m.subtitle && (
                <span className={`text-[10px] font-semibold ${m.changeType === 'negative' ? 'text-error' : 'text-on-surface-variant'}`}>
                  {m.subtitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bv-surface lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-semibold text-on-background">Attendance Overview</h3>
            <button
              type="button"
              onClick={() => safeNavigate(navigate, { to: myWorkRoutes.attendance })}
              className="text-label-md font-semibold text-secondary hover:underline transition-colors duration-200 cursor-pointer"
            >
              Full Report
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">Check-in</span>
              <span className="text-body-lg font-bold text-secondary">{todayAttendance?.checkIn ?? '—'}</span>
              <span className="text-[10px] text-on-surface-variant">{todayAttendance?.checkInNote}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">Total Hours</span>
              <span className="text-body-lg font-bold text-on-background">{todayAttendance?.totalHours ?? '—'}</span>
              <span className="text-[10px] text-on-surface-variant">{todayAttendance?.totalHoursNote}</span>
            </div>
            <div className="md:col-span-2 h-20 flex items-end gap-1.5">
              {weekHours.map((d) => (
                <div
                  key={d.day}
                  className={`flex-1 rounded-t-sm transition-colors duration-200 cursor-pointer ${
                    d.isToday ? 'bg-secondary' : d.pct > 0 ? 'bg-secondary/20 hover:bg-secondary/40' : 'bg-outline-variant/40'
                  }`}
                  style={{ height: d.pct > 0 ? `${Math.max(d.pct, 8)}%` : '2px' }}
                  title={`${d.day}: ${d.hours}h`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bv-surface p-6 flex flex-col gap-4">
          <h3 className="text-title-lg font-semibold text-on-background mb-1">Leave Summary</h3>
          {leaveBalances.map((lb) => (
            <div key={lb.type} className="bg-surface-container-low p-4 rounded-lg flex items-center justify-between border-l-4 border-secondary">
              <div className="flex flex-col">
                <span className="text-label-md font-semibold text-on-background">{lb.type} Leave</span>
                <span className="text-label-sm text-on-surface-variant">{lb.used} used out of {lb.total}</span>
              </div>
              <div className="text-right">
                <span className="text-body-lg font-bold text-secondary">{lb.remaining}</span>
                <span className="text-label-sm text-on-surface-variant block">left</span>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => safeNavigate(navigate, { to: myWorkRoutes.leave })}
            className="mt-auto w-full py-2.5 bg-deep-navy text-on-primary rounded-lg text-label-md font-medium hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Manage Leave
          </button>
        </div>
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg font-semibold text-on-background">Assigned Tasks</h3>
          <button
            type="button"
            onClick={() => safeNavigate(navigate, { to: myWorkRoutes.tasks })}
            className="px-3 py-1.5 text-label-sm bg-secondary text-on-secondary rounded-md hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Task Name</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Due Date</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Est. Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {myTasks.slice(0, 4).map((task: MyTask) => (
                <tr key={task.id} className="zebra-row cursor-pointer">
                  <td className="px-6 py-4 text-label-md font-semibold text-on-background">{task.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold ${priorityClass[task.priority] ?? ''}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{task.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
                      <span className={`w-2 h-2 rounded-full ${statusDot[task.status] ?? 'bg-outline'}`} />
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{task.estimatedHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        <div className="bv-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-semibold text-on-background">Recent Notifications</h3>
            <span className="bg-secondary text-on-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">3 UNREAD</span>
          </div>
          <div className="flex flex-col gap-3">
            {recentNotifications.map((n) => (
              <div
                key={n.id}
                className="flex gap-4 p-3 bg-surface-container-low rounded-lg relative overflow-hidden cursor-pointer transition-colors duration-200 hover:bg-surface-container"
              >
                <div className="w-1 bg-secondary absolute left-0 top-0 h-full" />
                <div className="bg-surface-container-lowest p-2 h-fit rounded-lg executive-shadow">
                  <span className="material-symbols-outlined text-secondary text-[20px]" aria-hidden="true">{n.icon}</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-label-md font-semibold text-on-background">{n.title}</span>
                    <span className="text-[10px] text-on-surface-variant shrink-0">{n.time}</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant mt-1">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bv-surface p-6">
          <h3 className="text-title-lg font-semibold text-on-background mb-6">Upcoming Events</h3>
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 p-3 border border-outline-variant rounded-lg hover:border-secondary card-hover cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center bg-surface-container p-2 rounded-lg min-w-[56px]">
                  <span className="text-label-sm font-bold text-on-surface-variant">{e.month}</span>
                  <span className="text-title-lg font-bold text-on-background">{e.day}</span>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-label-md font-semibold text-on-background">{e.title}</span>
                  <span className="text-label-sm text-on-surface-variant">{e.subtitle}</span>
                </div>
                <span className="material-symbols-outlined text-outline-variant" aria-hidden="true">{e.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
