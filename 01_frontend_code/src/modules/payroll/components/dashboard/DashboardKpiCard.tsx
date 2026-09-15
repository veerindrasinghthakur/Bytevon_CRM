import { cn } from '@/shared/lib/cn'

export function DashboardKpiCard({
  icon,
  label,
  value,
  hint,
  valueClass,
  accent,
}: {
  icon: string
  label: string
  value: string
  hint?: React.ReactNode
  valueClass?: string
  accent?: string
}) {
  return (
    <div className={cn('bv-surface card-hover p-4 h-[120px] flex flex-col justify-between', accent)}>
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-label-sm">{label}</span>
      </div>
      <div>
        <div className={cn('text-headline-lg font-semibold text-on-background', valueClass)}>{value}</div>
        {hint && <div className="text-caption mt-1">{hint}</div>}
      </div>
    </div>
  )
}
