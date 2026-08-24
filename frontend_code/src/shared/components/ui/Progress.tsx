import { cn } from '@/shared/lib/cn'
import { ProgressProps } from '@/shared/types'



export function Progress({
  value,
  max = 100,
  label,
  showValue = true,
  className,
  'aria-label': ariaLabel,
}: ProgressProps) {
  const safeMax = max <= 0 ? 100 : max
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100))

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex justify-between gap-2 text-label-sm">
          {label ? <span className="text-on-surface-variant">{label}</span> : <span />}
          {showValue ? (
            <span className="font-medium text-on-surface tabular-nums">{Math.round(pct)}%</span>
          ) : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label ?? 'Progress'}
        className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-secondary transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
