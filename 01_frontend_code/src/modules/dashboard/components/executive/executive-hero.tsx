import type { ExecutiveDashboardData } from '../../types/dashboard.types'

export function ExecutiveHero({ meta }: { meta: ExecutiveDashboardData['meta'] }) {
  return (
    <section className="relative overflow-hidden rounded-xl bg-deep-navy p-8 text-on-primary executive-shadow">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-headline-lg font-semibold mb-1">
            Welcome back, {meta.greetingName}
          </h1>
          <p className="text-body-md text-inverse-primary max-w-xl opacity-90">{meta.dateLine}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 border border-white/20 p-4 rounded-lg backdrop-blur-sm min-w-[140px]">
            <p className="text-label-sm uppercase tracking-wider opacity-70">Active Users</p>
            <p className="text-headline-md font-bold">{meta.activeUsers}</p>
          </div>
          <div className="bg-white/10 border border-white/20 p-4 rounded-lg backdrop-blur-sm min-w-[140px]">
            <p className="text-label-sm uppercase tracking-wider opacity-70">Present Today</p>
            <p className="text-headline-md font-bold">{meta.presentToday ?? '—'}</p>
          </div>
        </div>
      </div>
      <div className="absolute right-0 top-0 w-64 h-64 bg-secondary/20 blur-3xl -mr-32 -mt-32 rounded-full" />
    </section>
  )
}
