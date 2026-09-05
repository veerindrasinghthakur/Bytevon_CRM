import { cn } from '@/shared/lib/cn'
import type { LeadMetric } from '../types'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden="true">
      {name}
    </span>
  )
}

export function LeadMetricsRow({ metrics }: { metrics: LeadMetric[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((m) => (
        <div
          key={m.id}
          className={cn(
            'p-5 card-hover',
            m.id === 'pipeline'
              ? 'rounded-xl border border-primary-container bg-primary-container text-white executive-shadow'
              : 'bv-surface',
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <span
              className={cn(
                'p-2 rounded-lg',
                m.id === 'pipeline' ? 'bg-white/10 text-white' : 'bg-secondary/10 text-secondary',
              )}
            >
              <Icon name={m.icon} className="text-xl" />
            </span>
            {m.change && (
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  m.id === 'pipeline'
                    ? 'bg-white/10 text-white/80'
                    : m.changeType === 'positive'
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
          <p
            className={cn(
              'text-label-md',
              m.id === 'pipeline' ? 'text-white/70' : 'text-on-surface-variant',
            )}
          >
            {m.label}
          </p>
          <h3
            className={cn(
              'text-headline-md font-bold mt-0.5',
              m.id === 'pipeline' ? 'text-white' : 'text-on-background',
            )}
          >
            {m.value}
          </h3>
          {m.subtitle && (
            <p
              className={cn(
                'text-[11px] mt-1',
                m.id === 'pipeline' ? 'text-white/50' : 'text-on-surface-variant',
              )}
            >
              {m.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
