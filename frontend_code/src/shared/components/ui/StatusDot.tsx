import { cn } from '@/shared/lib/cn'
import { StatusDotProps } from '@/shared/types'




/**
 * Leftmost status indicator for list rows.
 * Green = Active, grey = Inactive. No status text column.
 */
export function StatusDot({ status, className, size = 'md' }: StatusDotProps) {
  const active = status === true || status === 'Active'
  return (
    <span
      className={cn(
        'inline-block rounded-full shrink-0',
        size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
        active ? 'bg-emerald-500' : 'bg-slate-400',
        className
      )}
      title={active ? 'Active' : 'Inactive'}
      aria-label={active ? 'Active' : 'Inactive'}
    />
  )
}
