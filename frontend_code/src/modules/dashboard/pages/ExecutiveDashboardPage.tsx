import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { useExecutiveDashboard } from '../hooks/use-executive-dashboard'

/** Matches HTML executive dashboard: bv-surface + card-hover + executive-shadow */
const card = 'bv-surface card-hover'

export function ExecutiveDashboardPage() {
  const navigate = useNavigate()
  const { kpis, pending, activities, meta, quickActions, isLoading } = useExecutiveDashboard()

  if (isLoading || !meta) {
    return (
      <div className="py-16 text-center text-body-sm text-on-surface-variant">Loading dashboard…</div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-xl bg-deep-navy p-8 text-on-primary executive-shadow">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-headline-lg font-semibold mb-1">Welcome back, {meta.greetingName}</h1>
            <p className="text-body-md text-inverse-primary max-w-xl opacity-90">{meta.dateLine}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 border border-white/20 p-4 rounded-lg backdrop-blur-sm min-w-[140px]">
              <p className="text-label-sm uppercase tracking-wider opacity-70">Uptime</p>
              <p className="text-headline-md font-bold">{meta.uptime}</p>
            </div>
            <div className="bg-white/10 border border-white/20 p-4 rounded-lg backdrop-blur-sm min-w-[140px]">
              <p className="text-label-sm uppercase tracking-wider opacity-70">Active Users</p>
              <p className="text-headline-md font-bold">{meta.activeUsers}</p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-secondary/20 blur-3xl -mr-32 -mt-32 rounded-full" />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {quickActions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate({ to: a.to })}
            className="bv-action-tile group"
          >
            <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors duration-200">
              <span className="material-symbols-outlined bv-action-icon">{a.icon}</span>
            </div>
            <span className="text-label-md text-on-surface mt-2">{a.label}</span>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${card} p-5`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
              <span className="text-secondary material-symbols-outlined">{k.icon}</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-headline-md font-bold text-on-background">{k.value}</span>
              <span className={cn('text-label-sm mb-1', k.up ? 'text-green-600' : 'text-red-500')}>{k.trend}</span>
            </div>
            <div className="h-10 w-full bg-surface-container rounded overflow-hidden">
              <div className="h-full w-full bg-secondary/10" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${card} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-title-lg font-semibold text-on-surface">Attendance Trend</h2>
            <select className="bg-surface border border-outline-variant text-label-sm rounded-lg px-3 py-1.5 outline-none focus:border-secondary transition-colors duration-200 cursor-pointer">
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="min-h-[240px] flex items-end justify-between gap-2 px-2 pb-2">
            {meta.attendanceBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-secondary/20 hover:bg-secondary rounded-t transition-colors duration-200 cursor-pointer"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className={`${card} p-6`}>
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
            {meta.revenueBars.map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 rounded-t-sm transition-colors duration-200 cursor-pointer',
                  i % 3 === 1 ? 'bg-secondary' : 'bg-surface-container-highest hover:bg-secondary'
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between px-4 border-t border-outline-variant pt-3 mt-2 text-label-sm text-on-surface-variant">
            {meta.months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${card} p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold text-on-background">Pending Approvals</h3>
            <span className="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {pending.length} New
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-secondary bv-row-hover cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                  {p.initials}
                </div>
                <div className="flex-1">
                  <p className="text-label-md text-on-surface leading-tight">{p.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{p.detail}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center bv-pressable cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </button>
                  <button type="button" className="w-8 h-8 rounded-full border border-outline text-on-surface-variant flex items-center justify-center hover:bg-error hover:text-white hover:border-error transition-colors duration-200 cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: '/approvals/pending' })}
            className="mt-3 text-secondary text-label-md hover:underline w-full text-center py-2 transition-colors duration-200 cursor-pointer"
          >
            View all requests
          </button>
        </div>

        <div className={`${card} p-6`}>
          <h3 className="text-title-lg font-semibold text-on-background mb-4">Recent Activities</h3>
          <div className="space-y-6 relative before:content-[''] before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-outline-variant">
            {activities.map((a) => (
              <div key={a.title} className="relative flex gap-4 pl-10">
                <div className="absolute left-0 w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center z-10 border border-white executive-shadow">
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

        <div className={`${card} p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold text-on-background">Calendar</h3>
            <button type="button" className="text-secondary material-symbols-outlined bv-icon-btn rounded-full p-1">
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
              <span key={d} className="py-2 text-outline">{d}</span>
            ))}
            {Array.from({ length: 27 }, (_, i) => i + 1).map((d) => (
              <span
                key={d}
                className={cn(
                  'py-2 rounded-lg transition-colors duration-200 cursor-pointer',
                  d === 24 && 'bg-secondary text-on-secondary font-bold',
                  d === 26 && 'border border-secondary text-secondary',
                  d !== 24 && d !== 26 && 'hover:bg-surface-container-low'
                )}
              >
                {d}
              </span>
            ))}
          </div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-3">Upcoming Deadlines</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border-l-4 border-error group cursor-pointer">
              <div className="flex flex-col items-center justify-center bg-white rounded p-1.5 min-w-[40px] executive-shadow group-hover:bg-error group-hover:text-white transition-colors duration-200">
                <span className="text-label-sm font-bold text-error group-hover:text-white">OCT</span>
                <span className="text-title-lg font-bold">26</span>
              </div>
              <div>
                <p className="text-label-md text-on-surface">Q3 Tax Filing</p>
                <p className="text-label-sm text-on-surface-variant">Due at 5:00 PM EST</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border-l-4 border-secondary group cursor-pointer">
              <div className="flex flex-col items-center justify-center bg-white rounded p-1.5 min-w-[40px] executive-shadow group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
                <span className="text-label-sm font-bold text-secondary group-hover:text-white">OCT</span>
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
