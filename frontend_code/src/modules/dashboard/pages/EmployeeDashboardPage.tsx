import { useNavigate } from '@tanstack/react-router'

const QUICK = [
  { label: 'Mark Attendance', icon: 'fingerprint', to: '/my-work/attendance/mark' },
  { label: 'Apply Leave', icon: 'event_available', to: '/my-work/leave/apply' },
  { label: 'View Payslip', icon: 'receipt_long', to: '/dashboard/employee' },
  { label: 'View Tasks', icon: 'task', to: '/my-work/tasks' },
  { label: 'Update Profile', icon: 'person_edit', to: '/profile' },
]

const KPIS = [
  { label: 'Attendance', value: '98%', note: '+2% this month', icon: 'trending_up', color: 'text-secondary' },
  { label: 'Rem. Leave', value: '12 Days', note: 'Expiring Dec 31', icon: 'event_note', color: 'text-on-surface-variant' },
  { label: 'Pending Leave', value: '1', note: 'Awaiting Manager', icon: 'hourglass_empty', color: 'text-error' },
  { label: 'Assigned Tasks', value: '5', note: '2 due this week', icon: 'assignment_turned_in', color: 'text-secondary' },
  { label: 'Notifications', value: '3', note: 'Unread priority', icon: 'notifications_active', color: 'text-secondary' },
]

const TASKS = [
  { name: 'Mobile App Wireframe Review', priority: 'High', due: 'Oct 25, 2024', status: 'In Progress', est: '8h' },
  { name: 'Quarterly Design System Audit', priority: 'Medium', due: 'Oct 30, 2024', status: 'Pending', est: '24h' },
  { name: 'Client Meeting: Feedback Integration', priority: 'High', due: 'Oct 26, 2024', status: 'Not Started', est: '4h' },
  { name: 'Accessibility Guidelines Update', priority: 'Low', due: 'Nov 05, 2024', status: 'Pending', est: '12h' },
]

export function EmployeeDashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden bg-primary-container rounded-xl p-8 text-on-secondary-container shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-headline-lg font-bold mb-2">Good Morning, Alex</h2>
            <div className="flex flex-wrap gap-3 text-on-primary-container">
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">badge</span> EMP-102
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">business_center</span> Design Dept
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full text-label-md">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span> Oct 24, 2024
              </span>
            </div>
          </div>
          <div className="bg-secondary/20 backdrop-blur-sm border border-secondary/30 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-secondary p-2 rounded-lg">
              <span className="material-symbols-outlined text-white">schedule</span>
            </div>
            <div>
              <span className="text-label-sm opacity-80 uppercase tracking-wider">Current Shift</span>
              <p className="text-title-lg">09:00 AM - 06:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-title-lg text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => navigate({ to: q.to })}
              className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-secondary hover:bg-secondary/5 transition-all group shadow-sm"
            >
              <span className="material-symbols-outlined text-[32px] text-secondary mb-3 group-hover:scale-110 transition-transform">
                {q.icon}
              </span>
              <span className="text-label-md font-bold text-on-surface">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {KPIS.map((k) => (
          <div key={k.label} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
              <span className={`material-symbols-outlined text-[18px] ${k.color}`}>{k.icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-headline-md font-bold">{k.value}</span>
              <span className="text-[10px] text-on-surface-variant">{k.note}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg text-primary">Attendance Overview</h3>
            <button type="button" className="text-secondary text-label-md font-bold hover:underline">
              Full Report
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-lg">
              <span className="text-label-sm text-on-surface-variant">Check-in</span>
              <p className="text-body-lg font-bold text-secondary">08:55 AM</p>
              <span className="text-[10px] text-on-surface-variant">On time</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg">
              <span className="text-label-sm text-on-surface-variant">Total Hours</span>
              <p className="text-body-lg font-bold text-primary">4.5h</p>
              <span className="text-[10px] text-on-surface-variant">45% of shift</span>
            </div>
            <div className="md:col-span-2 h-20 flex items-end gap-1">
              {[60, 85, 70, 90, 45, 10, 10].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm ${i === 4 ? 'bg-secondary' : 'bg-secondary/10'} hover:bg-secondary transition-colors`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-title-lg text-primary">Leave Summary</h3>
          {[
            { name: 'Casual Leave', used: '4 used out of 10', left: 6, border: 'border-secondary', color: 'text-secondary' },
            { name: 'Sick Leave', used: '2 used out of 8', left: 6, border: 'border-primary', color: 'text-primary' },
            { name: 'Earned Leave', used: '6 used out of 12', left: 6, border: 'border-outline', color: 'text-on-surface-variant' },
          ].map((l) => (
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

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg text-primary">Assigned Tasks</h3>
          <button
            type="button"
            onClick={() => navigate({ to: '/my-work/tasks/new' })}
            className="px-3 py-1.5 text-label-sm bg-secondary text-white rounded-md hover:opacity-90"
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
              {TASKS.map((t) => (
                <tr key={t.name} className="hover:bg-secondary/5 transition-colors">
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
