import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface MetricCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: string
  /** Optional value emphasis class (e.g. text-error) */
  valueClassName?: string
  className?: string
}

/** Reusable KPI / metric tile — tokens only. */
export function MetricCard({
  label,
  value,
  hint,
  icon,
  valueClassName,
  className,
}: MetricCardProps) {
  return (
    <div className={cn('bv-surface card-hover p-4 sm:p-5', className)}>
      <div className="flex justify-between items-start gap-2 mb-2">
        {icon ? (
          <div className="p-2 rounded-lg bg-secondary/15 text-secondary shrink-0">
            <span className="material-symbols-outlined text-[20px]" aria-hidden>
              {icon}
            </span>
          </div>
        ) : (
          <span />
        )}
        {hint ? (
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">
            {hint}
          </span>
        ) : null}
      </div>
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</p>
      <div className={cn('text-title-lg font-bold text-on-background mt-1', valueClassName)}>{value}</div>
    </div>
  )
}
