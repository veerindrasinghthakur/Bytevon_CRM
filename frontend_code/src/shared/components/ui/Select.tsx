import { cn } from '@/shared/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  minWidthClass?: string
  id?: string
  disabled?: boolean
  'aria-label'?: string
}

/** Native select restyled to Stitch surface + focus ring */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  minWidthClass = 'min-w-[140px]',
  id,
  disabled,
  'aria-label': ariaLabel,
}: SelectProps) {
  return (
    <div className={cn('relative', minWidthClass, className)}>
      <select
        id={id}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none cursor-pointer',
          'bg-surface-container-lowest border border-outline-variant/50 rounded-lg',
          'py-2 pl-4 pr-10',
          'text-body-md font-medium text-on-surface',
          'transition-interactive',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {placeholder != null && (
          <option value="" className="text-body-md text-on-surface-variant">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-body-md text-on-surface">
            {o.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
        expand_more
      </span>
    </div>
  )
}
