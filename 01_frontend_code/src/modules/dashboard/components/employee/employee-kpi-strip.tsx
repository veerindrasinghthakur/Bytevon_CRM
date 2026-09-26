import type { EmployeeDashboardData } from '../../types/dashboard.types'

const card = 'bv-surface card-hover'

export function EmployeeKpiStrip({ kpis }: { kpis: EmployeeDashboardData['kpis'] }) {
  return (
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
  )
}
