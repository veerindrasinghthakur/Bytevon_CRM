import { cn } from '@/shared/lib/cn'

export type CaseStudyMetric = {
  id: string
  label: string
  value: string
  icon: string
  change?: string
  changeType?: 'positive' | 'neutral' | string
  subtitle?: string
}

export function CaseStudyMetricsCards({ metrics }: { metrics: CaseStudyMetric[] }) {
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
                    ? 'status-badge status-success'
                    : 'status-badge status-neutral',
                )}
              >
                {m.change}
              </span>
            )}
          </div>
          <p className="text-label-md text-on-surface-variant">{m.label}</p>
          <h3 className="text-headline-md font-bold mt-0.5">{m.value}</h3>
          {m.subtitle && <p className="text-[11px] text-on-surface-variant mt-1">{m.subtitle}</p>}
        </div>
      ))}
    </div>
  )
}
