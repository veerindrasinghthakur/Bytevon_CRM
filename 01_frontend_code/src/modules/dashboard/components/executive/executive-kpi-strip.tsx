import { cn } from '@/shared/lib/cn'
import type { ExecutiveDashboardData } from '../../types/dashboard.types'

const card = 'bv-surface card-hover'

export function ExecutiveKpiStrip({ kpis }: { kpis: ExecutiveDashboardData['kpis'] }) {
  if (kpis.length === 0) return null
  return (
    <section
      className={cn(
        'grid grid-cols-1 gap-4',
        kpis.length >= 5 && 'md:grid-cols-2 lg:grid-cols-5',
        kpis.length === 4 && 'md:grid-cols-2 lg:grid-cols-4',
        kpis.length === 3 && 'md:grid-cols-3',
        kpis.length === 2 && 'md:grid-cols-2',
      )}
    >
      {kpis.map((k, i) => (
        <div key={`${k.label}-${i}`} className={`${card} p-5`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
              {k.label}
            </span>
            <span className="text-secondary material-symbols-outlined">{k.icon}</span>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-headline-md font-bold text-on-background">{k.value}</span>
            <span className={cn('text-label-sm mb-1', k.up ? 'text-green-600' : 'text-red-500')}>
              {k.trend}
            </span>
          </div>
          <div className="h-10 w-full bg-surface-container rounded overflow-hidden">
            <div className="h-full w-full bg-secondary/10" />
          </div>
        </div>
      ))}
    </section>
  )
}
