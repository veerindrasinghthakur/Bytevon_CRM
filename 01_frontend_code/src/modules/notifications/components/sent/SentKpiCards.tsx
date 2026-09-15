import { cn } from '@/shared/lib/cn'

export type SentKpi = {
  id: string
  label: string
  value: string | number
  hint?: string
  icon: string
  danger?: boolean
}

export function SentKpiCards({ kpis }: { kpis: SentKpi[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <div key={k.id} className={cn('bv-surface card-hover p-6', k.danger && 'border-l-4 border-l-error')}>
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-label-md uppercase tracking-wider">{k.label}</span>
            <div
              className={cn(
                'p-2 rounded-lg',
                k.danger ? 'bg-error-container text-error' : 'bg-surface-container-highest text-secondary',
              )}
            >
              <span className="material-symbols-outlined">{k.icon}</span>
            </div>
          </div>
          <h3
            className={cn(
              'text-headline-lg font-bold mt-4 tracking-tight',
              k.danger ? 'text-error' : 'text-on-background',
            )}
          >
            {k.value}
          </h3>
          {k.hint && (
            <p className={cn('text-label-sm mt-1', k.danger ? 'text-error font-bold' : 'text-secondary')}>
              {k.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
