import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'

export interface EntityOption {
  id: string | number
  label: string
  sublabel?: string
}

interface EntitySearchProps {
  label?: string
  placeholder?: string
  options: EntityOption[]
  /** Single select */
  value?: EntityOption | null
  onChange?: (value: EntityOption | null) => void
  /** Multi select chips */
  multi?: boolean
  values?: EntityOption[]
  onChangeMulti?: (values: EntityOption[]) => void
  disabled?: boolean
  className?: string
  emptyMessage?: string
}

export function EntitySearch({
  label,
  placeholder = 'Search…',
  options,
  value = null,
  onChange,
  multi = false,
  values = [],
  onChangeMulti,
  disabled,
  className,
  emptyMessage = 'No matches',
}: EntitySearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedIds = useMemo(() => {
    if (multi) return new Set(values.map((v) => String(v.id)))
    return new Set(value ? [String(value.id)] : [])
  }, [multi, values, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = options
    if (q) {
      list = options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sublabel ?? '').toLowerCase().includes(q)
      )
    }
    return list.slice(0, 12)
  }, [options, query])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (opt: EntityOption) => {
    if (multi) {
      const id = String(opt.id)
      if (selectedIds.has(id)) {
        onChangeMulti?.(values.filter((v) => String(v.id) !== id))
      } else {
        onChangeMulti?.([...values, opt])
      }
      setQuery('')
    } else {
      onChange?.(opt)
      setQuery(opt.label)
      setOpen(false)
    }
  }

  const clearSingle = () => {
    onChange?.(null)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-label-sm text-on-surface-variant mb-1">{label}</label>
      )}

      {multi && values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-electric-blue/10 text-electric-blue text-label-sm"
            >
              {v.label}
              <button
                type="button"
                className="p-0.5 rounded-full hover:bg-electric-blue/20"
                aria-label={`Remove ${v.label}`}
                onClick={() => onChangeMulti?.(values.filter((x) => String(x.id) !== String(v.id)))}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          type="search"
          disabled={disabled}
          value={multi ? query : value && !open ? value.label : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!multi && value) onChange?.(null)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest',
            'text-body-md text-on-background placeholder:text-on-surface-variant',
            'focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
          autoComplete="off"
        />
        {!multi && value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-background"
            onClick={clearSingle}
            aria-label="Clear"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {open && !disabled && (
        <ul
          className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-3 text-body-sm text-on-surface-variant">{emptyMessage}</li>
          )}
          {filtered.map((opt) => {
            const active = selectedIds.has(String(opt.id))
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    'w-full text-left px-3 py-2.5 flex items-start gap-3',
                    'hover:bg-surface-container',
                    active && 'bg-electric-blue/5'
                  )}
                  onClick={() => pick(opt)}
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px] mt-0.5">
                    {active ? 'check_circle' : 'person'}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body-md text-on-background font-medium">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="block text-body-sm text-on-surface-variant">{opt.sublabel}</span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
