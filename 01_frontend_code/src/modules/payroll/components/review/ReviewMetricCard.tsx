import { cn } from '@/shared/lib/cn'

export function ReviewMetricCard({
  title,
  value,
  hint,
  icon,
  iconBg,
}: {
  title: string
  value: string
  hint: React.ReactNode
  icon: string
  iconBg: string
}) {
  return (
    <div className="bv-surface card-hover p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-body-sm text-on-surface-variant">{title}</h3>
        <div className={cn('p-2 rounded-lg', iconBg)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-headline-md font-semibold text-on-surface">{value}</div>
        <div className="text-body-sm text-on-surface-variant mt-1">{hint}</div>
      </div>
    </div>
  )
}
