import { Button, type ButtonSize } from '@/shared/components/ui/Button'

export interface SaveDraftButtonProps {
  onClick?: () => void
  isLoading?: boolean
  disabled?: boolean
  size?: ButtonSize
  className?: string
  label?: string
}

/** Shared Save draft control for forms that support draft persistence. */
export function SaveDraftButton({
  onClick,
  isLoading,
  disabled,
  size = 'sm',
  className,
  label = 'Save draft',
}: SaveDraftButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      isLoading={isLoading}
      disabled={disabled}
      onClick={onClick}
      leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
    >
      {label}
    </Button>
  )
}
