import { cn } from '@/shared/lib/cn'

export type CenterKpi = {
  id: string
  label: string
  value: string | number
  hint: string
  icon: string
  hintTone?: 'positive' | 'danger' | 'neutral'
}

export function CenterKpiCards({ kpis }: { kpis: CenterKpi[] }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {kpis.map((k) => (
        <div key={k.id} className="bv-surface card-hover p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-on-surface-variant text-label-md">{k.label}</span>
            <span
              className={cn(
                'material-symbols-outlined text-xl',
                k.hintTone === 'danger' ? 'text-error' : 'text-secondary',
              )}
            >
              {k.icon}
            </span>
          </div>
          <p className="text-headline-md font-semibold text-on-background">{k.value}</p>
          <p
            className={cn(
              'text-[11px] font-bold mt-1',
              k.hintTone === 'positive' && 'text-secondary',
              k.hintTone === 'danger' && 'text-error',
              k.hintTone === 'neutral' && 'text-on-surface-variant',
            )}
          >
            {k.hint}
          </p>
        </div>
      ))}
    </section>
  )
}
