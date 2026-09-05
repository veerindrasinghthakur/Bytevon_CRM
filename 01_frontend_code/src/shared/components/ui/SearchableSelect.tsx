import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { SearchableOption } from '@/shared/types'

/**
 * Typeahead select — panel styling matches redesigned Select options panel.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  disabled,
  className,
  emptyLabel = 'No matches',
  label,
}: {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  emptyLabel?: string
  /** Optional field label above the control */
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (selected && !open) setQuery(selected.label)
  }, [selected, open])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || (selected && query === selected.label)) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.meta && o.meta.toLowerCase().includes(q)) ||
        o.value.toLowerCase().includes(q),
    )
  }, [options, query, selected])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {label ? (
        <label className="block text-label-sm text-on-surface-variant mb-1.5">{label}</label>
      ) : null}
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (value) onChange('')
          }}
          className={cn(
            'w-full h-11 border border-outline-variant rounded-lg px-4 pr-10 text-body-md',
            'bg-surface-container-lowest outline-none',
            'focus:border-secondary focus:ring-1 focus:ring-secondary/40',
            'transition-colors duration-200',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      {open && !disabled && (
        <ul
          className={cn(
            'absolute z-50 mt-2 w-full max-h-[240px] overflow-y-auto',
            'rounded-xl border border-outline-variant/50 bg-surface-container-lowest executive-shadow py-1',
          )}
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-body-sm text-on-surface-variant">{emptyLabel}</li>
          ) : (
            filtered.map((o) => {
              const isSelected = o.value === value
              return (
                <li key={o.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={o.disabled}
                    className={cn(
                      'w-full h-11 px-4 flex items-center justify-between gap-2 text-left text-body-md',
                      'transition-colors duration-200',
                      o.disabled && 'opacity-50 cursor-not-allowed',
                      !o.disabled && !isSelected && 'hover:bg-surface-container-low cursor-pointer',
                      isSelected && 'bg-secondary-container text-secondary font-medium',
                    )}
                    onClick={() => {
                      if (o.disabled) return
                      onChange(o.value)
                      setQuery(o.label)
                      setOpen(false)
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{o.label}</span>
                      {o.meta ? (
                        <span className="block text-xs text-on-surface-variant truncate">{o.meta}</span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <span
                        className="material-symbols-outlined text-secondary text-[20px] shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        aria-hidden
                      >
                        check
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
