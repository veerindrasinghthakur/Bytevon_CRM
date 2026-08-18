import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/Button'

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this page. Try again or go back.',
  onRetry,
  onBack,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  onBack?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-sm',
        className,
      )}
    >
      <span className="material-symbols-outlined text-5xl text-error mb-3" aria-hidden>
        error
      </span>
      <h3 className="text-title-lg font-semibold text-on-background">{title}</h3>
      <p className="mt-2 text-body-sm text-on-surface-variant max-w-md mx-auto">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Retry
          </Button>
        )}
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Go back
          </Button>
        )}
      </div>
    </div>
  )
}
