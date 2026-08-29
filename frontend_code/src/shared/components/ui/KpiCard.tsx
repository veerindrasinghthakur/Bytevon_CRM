import { cn } from '@/shared/lib/cn'
import type { KpiCardProps } from '@/shared/types'

export function KpiCard({
  icon,
  iconClass,
  label,
  value,
  trend,
  trendUp,
  trendClass,
  onClick,
  className,
}: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bv-surface card-hover p-4 text-left w-full',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={cn('p-2 rounded-lg', iconClass)}>
          <span className="material-symbols-outlined" aria-hidden>
            {icon}
          </span>
        </span>
        <div className={cn('flex items-center gap-1 text-label-sm', trendClass ?? 'text-on-surface-variant')}>
          <span className="material-symbols-outlined text-[14px]" aria-hidden>
            {trendUp ? 'trending_up' : 'trending_flat'}
          </span>
          <span>{trend}</span>
        </div>
      </div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <h3 className="text-headline-md font-semibold text-on-background">{value}</h3>
    </button>
  )
}