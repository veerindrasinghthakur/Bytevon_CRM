import { cn } from '@/shared/lib/cn'

export interface DateRangeValue {
  from: string
  to: string
}

export interface DateRangeFilterProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  /** Optional single-date mode: sets both from and to */
  label?: string
  className?: string
  fromLabel?: string
  toLabel?: string
  disabled?: boolean
}

/**
 * Shared date / range picker for list filter bars.
 * Values are ISO date strings (yyyy-mm-dd) suitable for query params.
 */
export function DateRangeFilter({
  value,
  onChange,
  label = 'Date range',
  className,
  fromLabel = 'From',
  toLabel = 'To',
  disabled,
}: DateRangeFilterProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-label-sm text-on-surface-variant whitespace-nowrap sr-only md:not-sr-only">
        {label}
      </span>
      <label className="flex items-center gap-1.5">
        <span className="text-label-sm text-on-surface-variant">{fromLabel}</span>
        <input
          type="date"
          value={value.from}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className={cn(
            'px-2 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest',
            'text-body-sm text-on-surface outline-none',
            'focus:border-secondary focus:ring-1 focus:ring-secondary',
            'disabled:opacity-50',
          )}
          aria-label={fromLabel}
        />
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-label-sm text-on-surface-variant">{toLabel}</span>
        <input
          type="date"
          value={value.to}
          disabled={disabled}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className={cn(
            'px-2 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest',
            'text-body-sm text-on-surface outline-none',
            'focus:border-secondary focus:ring-1 focus:ring-secondary',
            'disabled:opacity-50',
          )}
          aria-label={toLabel}
        />
      </label>
    </div>
  )
}
