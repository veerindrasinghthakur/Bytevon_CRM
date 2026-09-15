import { cn } from '@/shared/lib/cn'
import { changeTypeStyles } from '../../schemas/enums'

type Metric = {
  id: string
  icon: string
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
}

type Props = {
  metrics: Metric[]
}

/** Top KPI metric cards for sales dashboard. */
export function DashboardMetricsCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.id} className="bv-surface card-hover p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-xl">{m.icon}</span>
            </span>
            {m.change && (
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  changeTypeStyles[m.changeType ?? 'neutral'] ?? changeTypeStyles.neutral,
                )}
              >
                {m.change}
              </span>
            )}
          </div>
          <p className="text-label-md text-on-surface-variant">{m.label}</p>
          <h3 className="text-headline-md font-bold mt-0.5 text-on-background">{m.value}</h3>
          {m.subtitle && <p className="text-[11px] mt-1 text-on-surface-variant">{m.subtitle}</p>}
        </div>
      ))}
    </div>
  )
}
