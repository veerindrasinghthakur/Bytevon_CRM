import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { RefreshButtonProps } from '@/shared/types'




export function RefreshButton({
  onClick,
  isLoading = false,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Refresh',
  iconOnly = false,
  disabled,
  title = 'Refresh data',
}: RefreshButtonProps) {
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        title={title}
        aria-label={title}
        className={cn(
          'p-0.5 pt-1 h-8 rounded-lg border border-outline-variant text-on-surface-variant',
          'hover:text-secondary hover:border-secondary transition-colors',
          'disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined text-[22px]',
            isLoading && 'animate-spin',
          )}
          aria-hidden
        >
          refresh
        </span>
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isLoading}
      onClick={onClick}
      leftIcon={
        <span
          className={cn('material-symbols-outlined text-[18px]', isLoading && 'animate-spin')}
          aria-hidden
        >
          refresh
        </span>
      }
    >
      {label}
    </Button>
  )
}
