import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { EditButtonProps } from '@/shared/types'



export function EditButton({
  onClick,
  iconOnly = false,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Edit',
  disabled,
  title = 'Edit',
  'aria-label': ariaLabel,
}: EditButtonProps) {
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel ?? title}
        className={cn(
          'p-2 rounded-lg border border-outline-variant text-on-surface-variant',
          'hover:text-secondary hover:border-secondary transition-colors duration-200 cursor-pointer',
          'disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden>
          edit
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
      disabled={disabled}
      onClick={onClick}
      leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
    >
      {label}
    </Button>
  )
}
