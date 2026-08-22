import { Button, type ButtonSize, type ButtonVariant } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

export interface EditButtonProps {
  onClick?: () => void
  /** Icon-only pencil (for card headers) vs labeled Edit */
  iconOnly?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  label?: string
  disabled?: boolean
  title?: string
  'aria-label'?: string
}

/**
 * Shared edit control — use with useEditMode (startEditing).
 * Prefer iconOnly on dense headers; labeled button on page toolbars.
 */
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
