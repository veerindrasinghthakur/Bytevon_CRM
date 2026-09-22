import { cn } from '@/shared/lib/cn'

export type ArchivedBadgeProps = {
  className?: string
}

/**
 * Small "Archived" pill for detail headers of soft-deleted rows.
 * Matches the neutral ARCHIVED pills used in admin list tables.
 */
export function ArchivedBadge({ className }: ArchivedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant border border-outline-variant',
        className,
      )}
    >
      <span className="material-symbols-outlined text-[14px]" aria-hidden>
        archive
      </span>
      Archived
    </span>
  )
}
