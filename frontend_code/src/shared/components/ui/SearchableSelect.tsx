import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'

export interface SearchableOption {
  value: string
  label: string
  meta?: string
}

/**
 * Typeahead select — user can type to filter options.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  disabled,
  className,
  emptyLabel = 'No matches',
}: {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  emptyLabel?: string
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
            'w-full border border-outline-variant rounded-lg px-3 py-2.5 pr-9 text-body-sm',
            'outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-transparent',
            disabled && 'opacity-60 cursor-not-allowed',
          )}
        />
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      {open && !disabled && (
        <ul className="absolute z-40 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-body-sm text-on-surface-variant">{emptyLabel}</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container-low',
                    o.value === value && 'bg-secondary/10 text-secondary font-medium',
                  )}
                  onClick={() => {
                    onChange(o.value)
                    setQuery(o.label)
                    setOpen(false)
                  }}
                >
                  <span className="block">{o.label}</span>
                  {o.meta && (
                    <span className="block text-xs text-on-surface-variant">{o.meta}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
