import { useNavigate } from '@tanstack/react-router'
import {
  currentUser,
  myWorkMetrics,
  todayAttendance,
  weekHours,
  leaveBalances,
  myTasks,
  recentNotifications,
  upcomingEvents,
} from '../data/mock'
import type { MyTask } from '../types'

const priorityClass: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-surface-container-high text-on-surface-variant',
  Low: 'bg-surface-container text-on-surface-variant',
}

const statusDot: Record<string, string> = {
  'In Progress': 'bg-secondary',
  Pending: 'bg-outline',
  'Not Started': 'bg-outline',
  Completed: 'bg-emerald-500',
  Blocked: 'bg-orange-500',
}

export function MyWorkOverviewPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8 max-w-[1440px]">
      {/* Welcome */}
      <section className="relative overflow-hidden bg-deep-navy rounded-xl p-8 text-on-primary shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-headline-md md:text-headline-lg font-bold tracking-tight mb-3">
              Good Morning, {currentUser.firstName}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-inverse-primary">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[18px]">badge</span>
                {currentUser.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[18px]">business_center</span>
                {currentUser.department}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                {currentUser.todayLabel}
              </span>
            </div>
          </div>
          <div className="bg-secondary/20 border border-secondary/40 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-secondary p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-secondary">schedule</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-inverse-primary">Current Shift</span>
              <span className="text-title-lg font-semibold text-on-primary">{currentUser.shift}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h3 className="text-title-lg font-semibold text-on-background mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: 'fingerprint', label: 'Mark Attendance', to: '/my-work/attendance' as const },
            { icon: 'event_available', label: 'Apply Leave', to: '/my-work/leave' as const },
            { icon: 'receipt_long', label: 'View Payslip', to: '/my-work' as const },
            { icon: 'task', label: 'View Tasks', to: '/my-work/tasks' as const },
            { icon: 'person_edit', label: 'Update Profile', to: '/profile' as const },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate({ to: action.to })}
              className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-secondary hover:bg-secondary/5 transition-all group shadow-sm"
            >
              <span className="material-symbols-outlined text-[32px] text-secondary mb-3 group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
              <span className="text-label-md font-semibold text-on-background">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {myWorkMetrics.map((m) => (
          <div
            key={m.id}
            className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
                {m.label}
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">{m.icon}</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-headline-md font-bold text-on-background">{m.value}</span>
              {m.subtitle && (
                <span
                  className={`text-[10px] font-semibold ${
                    m.changeType === 'negative' ? 'text-error' : 'text-on-surface-variant'
                  }`}
                >
                  {m.subtitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Attendance + Leave */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-semibold text-on-background">Attendance Overview</h3>
            <button
              type="button"
              onClick={() => navigate({ to: '/my-work/attendance' })}
              className="text-label-md font-semibold text-secondary hover:underline"
            >
              Full Report
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">Check-in</span>
              <span className="text-body-lg font-bold text-secondary">{todayAttendance.checkIn}</span>
              <span className="text-[10px] text-on-surface-variant">{todayAttendance.checkInNote}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">Total Hours</span>
              <span className="text-body-lg font-bold text-on-background">{todayAttendance.totalHours}</span>
              <span className="text-[10px] text-on-surface-variant">{todayAttendance.totalHoursNote}</span>
            </div>
            <div className="md:col-span-2 h-20 flex items-end gap-1.5">
              {weekHours.map((d) => (
                <div
                  key={d.day}
                  className={`flex-1 rounded-t-sm transition-colors ${
                    d.isToday
                      ? 'bg-secondary'
                      : d.pct > 0
                        ? 'bg-secondary/20 hover:bg-secondary/40'
                        : 'bg-outline-variant/40'
                  }`}
                  style={{ height: d.pct > 0 ? `${Math.max(d.pct, 8)}%` : '2px' }}
                  title={`${d.day}: ${d.hours}h`}
                />
              ))}
            </div>
          </div>
          <div className="h-28 flex items-center justify-center bg-surface-container-low rounded-lg">
            <span className="text-label-md text-on-surface-variant italic">Weekly hours trend (Mon–Sun)</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-title-lg font-semibold text-on-background mb-1">Leave Summary</h3>
          {leaveBalances.map((lb) => (
            <div
              key={lb.type}
              className="bg-surface-container-low p-4 rounded-lg flex items-center justify-between border-l-4 border-secondary"
            >
              <div className="flex flex-col">
                <span className="text-label-md font-semibold text-on-background">{lb.type} Leave</span>
                <span className="text-label-sm text-on-surface-variant">
                  {lb.used} used out of {lb.total}
                </span>
              </div>
              <div className="text-right">
                <span className="text-body-lg font-bold text-secondary">{lb.remaining}</span>
                <span className="text-label-sm text-on-surface-variant block">left</span>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate({ to: '/my-work/leave' })}
            className="mt-auto w-full py-2.5 bg-deep-navy text-on-primary rounded-lg text-label-md font-medium hover:opacity-90 transition-opacity"
          >
            Manage Leave
          </button>
        </div>
      </section>

      {/* Tasks */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg font-semibold text-on-background">Assigned Tasks</h3>
          <button
            type="button"
            onClick={() => navigate({ to: '/my-work/tasks' })}
            className="px-3 py-1.5 text-label-sm bg-secondary text-on-secondary rounded-md hover:opacity-90"
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
                <tr key={task.id} className="hover:bg-secondary/5 transition-colors">
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

      {/* Notifications + Events */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-semibold text-on-background">Recent Notifications</h3>
            <span className="bg-secondary text-on-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">
              3 UNREAD
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {recentNotifications.map((n) => (
              <div key={n.id} className="flex gap-4 p-3 bg-surface-container-low rounded-lg relative overflow-hidden">
                <div className="w-1 bg-secondary absolute left-0 top-0 h-full" />
                <div className="bg-surface-container-lowest p-2 h-fit rounded-lg shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]">{n.icon}</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-label-md font-semibold text-on-background">{n.title}</span>
                    <span className="text-[10px] text-on-surface-variant shrink-0">{n.time}</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant mt-1">{n.body}</p>
                  {n.tag && (
                    <span className="mt-2 text-[10px] font-bold text-secondary uppercase tracking-tight">{n.tag}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background mb-6">Upcoming Events</h3>
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 p-3 border border-outline-variant rounded-lg hover:border-secondary transition-colors"
              >
                <div className="flex flex-col items-center justify-center bg-surface-container p-2 rounded-lg min-w-[56px]">
                  <span className="text-label-sm font-bold text-on-surface-variant">{e.month}</span>
                  <span className="text-title-lg font-bold text-on-background">{e.day}</span>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-label-md font-semibold text-on-background">{e.title}</span>
                  <span className="text-label-sm text-on-surface-variant">{e.subtitle}</span>
                </div>
                <span className="material-symbols-outlined text-outline-variant">{e.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
