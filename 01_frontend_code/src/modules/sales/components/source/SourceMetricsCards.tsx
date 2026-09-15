import type { SourceMetric } from '../../api/source'

const FALLBACK: SourceMetric[] = [
  { id: 'total', label: 'Total sources', value: '—', icon: 'hub' },
  { id: 'top', label: 'Source with highest leads', value: '—', icon: 'emoji_events' },
]

export function SourceMetricsCards({ metrics }: { metrics: SourceMetric[] }) {
  const list = metrics.length ? metrics : FALLBACK
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {list.map((m) => (
        <div key={m.id} className="bv-surface card-hover p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-xl">{m.icon ?? 'hub'}</span>
            </span>
          </div>
          <p className="text-label-md text-on-surface-variant">{m.label}</p>
          <h3 className="text-headline-md font-bold mt-0.5 text-on-background break-words">
            {m.value}
          </h3>
        </div>
      ))}
    </div>
  )
}
