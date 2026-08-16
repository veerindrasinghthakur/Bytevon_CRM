import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

const KPIS = [
  { label: 'Employees', value: '1,482', trend: '+4.2%', up: true, icon: 'groups' },
  { label: 'Attendance', value: '96.8%', trend: '+0.5%', up: true, icon: 'how_to_reg' },
  { label: 'Leave Requests', value: '14', trend: '-2.1%', up: false, icon: 'event_busy' },
  { label: 'Revenue', value: '$42.8M', trend: '+12.4%', up: true, icon: 'payments' },
  { label: 'Open Tasks', value: '245', trend: '+8%', up: true, icon: 'task_alt' },
]

const QUICK_ACTIONS = [
  { label: 'Add Employee', icon: 'person_add', to: '/workforce/employees/new' },
  { label: 'Create Invoice', icon: 'receipt_long', to: '/dashboard' },
  { label: 'New Task', icon: 'assignment', to: '/projects/tasks/new' },
  { label: 'Schedule Meet', icon: 'event', to: '/dashboard' },
  { label: 'Import Data', icon: 'upload_file', to: '/dashboard' },
  { label: 'View All', icon: 'more_horiz', to: '/dashboard' },
]

const PENDING = [
  { name: 'Sarah Chen', detail: 'Annual Leave • 3 Days', initials: 'SC' },
  { name: 'Marcus Miller', detail: 'Expense Claim • $1,240', initials: 'MM' },
  { name: 'Elena Rossi', detail: 'Training Request • AI Ethics', initials: 'ER' },
]

const ACTIVITIES = [
  { icon: 'person_add', title: 'New employee onboarded', desc: 'Jordan Smith added to Engineering team', time: '10 minutes ago' },
  { icon: 'security', title: 'Security Policy Updated', desc: '2FA enforcement enabled for all Admin accounts', time: '1 hour ago' },
  { icon: 'database', title: 'Cloud Backup Completed', desc: 'ERP primary database successfully mirrored to AWS-West', time: '4 hours ago' },
]

export function ExecutiveDashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-xl bg-primary-container p-8 text-on-primary">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-headline-lg font-semibold mb-1">Welcome back, Alex</h1>
            <p className="text-body-md text-on-primary-container max-w-xl opacity-90">
              Today is October 24th. You have 3 pending employee approvals and your quarterly revenue targets are
              trending 12% above forecast. Systems are optimal.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 border border-white/20 p-4 rounded-lg backdrop-blur-sm min-w-[140px]">
              <p className="text-label-sm uppercase tracking-wider opacity-70">Uptime</p>
              <p className="text-headline-md font-bold">99.98%</p>
            </div>
            <div className="bg-white/10 border border-white/20 p-4 rounded-lg backdrop-blur-sm min-w-[140px]">
              <p className="text-label-sm uppercase tracking-wider opacity-70">Active Users</p>
              <p className="text-headline-md font-bold">1,242</p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-secondary/20 blur-3xl -mr-32 -mt-32 rounded-full" />
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate({ to: a.to })}
            className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-col items-center gap-2 hover:border-secondary transition-all group shadow-sm active:scale-95"
          >
            <div className="w-10 h-10 bg-secondary-container/10 text-secondary rounded-full flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">{a.icon}</span>
            </div>
            <span className="text-label-md text-on-surface">{a.label}</span>
          </button>
        ))}
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
              <span className="text-secondary material-symbols-outlined">{k.icon}</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-headline-md font-bold">{k.value}</span>
              <span className={cn('text-label-sm mb-1', k.up ? 'text-green-600' : 'text-red-500')}>{k.trend}</span>
            </div>
            <div className="h-10 w-full bg-surface-container rounded overflow-hidden">
              <div className="h-full w-full bg-secondary/10" />
            </div>
          </div>
        ))}
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-title-lg font-semibold text-on-surface">Attendance Trend</h2>
            <select className="bg-surface border border-outline-variant text-label-sm rounded-lg px-3 py-1.5 outline-none focus:border-secondary">
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="min-h-[240px] flex items-end justify-between gap-2 px-2 pb-2">
            {[40, 55, 45, 70, 60, 80, 65, 75, 85, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-secondary/20 hover:bg-secondary rounded-t transition-colors"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-title-lg font-semibold text-on-surface">Revenue Trend</h2>
            <div className="flex gap-3 text-label-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Actual
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full bg-outline" /> Target
              </span>
            </div>
          </div>
          <div className="min-h-[240px] flex items-end justify-between gap-3 px-4 pb-2">
            {[60, 85, 45, 70, 95, 55, 80, 90, 65, 100].map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 rounded-t-sm transition-all',
                  i % 3 === 1 ? 'bg-secondary' : 'bg-surface-container-highest hover:bg-secondary'
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between px-4 border-t border-outline-variant pt-3 mt-2 text-label-sm text-on-surface-variant">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold">Pending Approvals</h3>
            <span className="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              3 New
            </span>
          </div>
          <div className="space-y-3">
            {PENDING.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-colors border-l-4 border-secondary"
              >
                <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                  {p.initials}
                </div>
                <div className="flex-1">
                  <p className="text-label-md text-on-surface leading-tight">{p.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{p.detail}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border border-outline text-on-surface-variant flex items-center justify-center hover:bg-error hover:text-white hover:border-error"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: '/approvals/pending' })}
            className="mt-3 text-secondary text-label-md hover:underline w-full text-center py-2"
          >
            View all requests
          </button>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <h3 className="text-title-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-6 relative before:content-[''] before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-outline-variant">
            {ACTIVITIES.map((a) => (
              <div key={a.title} className="relative flex gap-4 pl-10">
                <div className="absolute left-0 w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center z-10 border border-white">
                  <span className="material-symbols-outlined text-secondary text-[20px]">{a.icon}</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface">{a.title}</p>
                  <p className="text-body-sm text-on-surface-variant">{a.desc}</p>
                  <p className="text-label-sm text-outline mt-1">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold">Calendar</h3>
            <button type="button" className="text-secondary material-symbols-outlined">
              chevron_right
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-label-sm text-on-surface-variant mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-label-md mb-6">
            {[28, 29, 30, 31].map((d) => (
              <span key={d} className="py-2 text-outline">
                {d}
              </span>
            ))}
            {Array.from({ length: 27 }, (_, i) => i + 1).map((d) => (
              <span
                key={d}
                className={cn(
                  'py-2 rounded-lg',
                  d === 24 && 'bg-secondary text-on-secondary font-bold',
                  d === 26 && 'border border-secondary text-secondary'
                )}
              >
                {d}
              </span>
            ))}
          </div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-3">Upcoming Deadlines</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border-l-4 border-error">
              <div className="flex flex-col items-center justify-center bg-white rounded p-1.5 min-w-[40px] shadow-sm">
                <span className="text-label-sm font-bold text-error">OCT</span>
                <span className="text-title-lg font-bold">26</span>
              </div>
              <div>
                <p className="text-label-md text-on-surface">Q3 Tax Filing</p>
                <p className="text-label-sm text-on-surface-variant">Due at 5:00 PM EST</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border-l-4 border-secondary">
              <div className="flex flex-col items-center justify-center bg-white rounded p-1.5 min-w-[40px] shadow-sm">
                <span className="text-label-sm font-bold text-secondary">OCT</span>
                <span className="text-title-lg font-bold">28</span>
              </div>
              <div>
                <p className="text-label-md text-on-surface">Strategy Meet</p>
                <p className="text-label-sm text-on-surface-variant">Boardroom A</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
