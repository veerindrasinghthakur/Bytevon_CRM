import { Button } from '@/shared/components/ui/Button'
import { SaveDraftButtonProps } from '@/shared/types'



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
