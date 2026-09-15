import { cn } from '@/shared/lib/cn'

export function SettingsToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'w-10 h-5 rounded-full relative transition-colors shrink-0',
        checked ? 'bg-secondary' : 'bg-outline-variant',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
