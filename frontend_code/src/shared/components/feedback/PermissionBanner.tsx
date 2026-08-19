import { cn } from '@/shared/lib/cn'

export function PermissionBanner({
  message = 'You do not have permission to view or change this section.',
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-body-sm text-on-surface',
        className,
      )}
      role="status"
    >
      <span className="material-symbols-outlined text-warning shrink-0" aria-hidden>
        lock
      </span>
      <p>{message}</p>
    </div>
  )
}
