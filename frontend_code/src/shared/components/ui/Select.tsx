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
  label?: string
  error?: string
  className?: string
  minWidthClass?: string
  id?: string
  disabled?: boolean
  'aria-label'?: string
}

/** Native select restyled to surface + focus ring; optional label/error. */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  label,
  error,
  className,
  minWidthClass = 'min-w-[140px]',
  id,
  disabled,
  'aria-label': ariaLabel,
}: SelectProps) {
  const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

  return (
    <div className={cn('relative', minWidthClass, className)}>
      {label ? (
        <label htmlFor={selectId} className="block text-label-sm text-on-surface-variant mb-1.5">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          aria-label={ariaLabel ?? placeholder ?? label}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none cursor-pointer',
            'bg-surface-container-lowest border rounded-lg',
            'py-2 pl-4 pr-10',
            'text-body-md font-medium text-on-surface',
            'transition-colors duration-200',
            'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-error' : 'border-outline-variant/50',
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
      {error ? (
        <p className="mt-1 text-label-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
