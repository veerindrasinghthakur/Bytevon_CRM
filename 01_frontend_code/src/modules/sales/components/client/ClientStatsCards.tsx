import { cn } from '@/shared/lib/cn'

type Metric = {
  id: string
  icon: string
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

type Props = {
  metrics: Metric[]
}

/** KPI metric cards row for clients list. */
export function ClientStatsCards({ metrics }: Props) {
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
                  m.changeType === 'positive'
                    ? 'text-emerald-700 bg-emerald-50'
                    : m.changeType === 'negative'
                      ? 'text-red-700 bg-red-50'
                      : 'text-on-surface-variant bg-surface-container',
                )}
              >
                {m.change}
              </span>
            )}
          </div>
          <p className="text-label-md text-on-surface-variant">{m.label}</p>
          <h3 className="text-headline-md font-bold mt-0.5 text-on-background">{m.value}</h3>
        </div>
      ))}
    </div>
  )
}
