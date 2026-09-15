import { cn } from '@/shared/lib/cn'

export function MonthlySummaryCard({
  label,
  value,
  valueClass,
  highlight,
}: {
  label: string
  value: string
  valueClass?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'bv-surface card-hover p-5 flex flex-col justify-center h-[120px]',
        highlight && 'ring-1 ring-primary',
      )}
    >
      <p
        className={cn(
          'text-caption text-on-surface-variant uppercase tracking-wider mb-1',
          highlight && 'text-primary font-semibold',
        )}
      >
        {label}
      </p>
      <p className={cn('text-headline-lg font-semibold text-on-background', valueClass)}>{value}</p>
    </div>
  )
}
