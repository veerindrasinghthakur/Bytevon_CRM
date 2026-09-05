import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { SelectOption, SelectProps } from '@/shared/types'

/**
 * Custom select — options panel matches Bytevon Component Reference design.
 * Default minWidthClass is compact so filter bars stay on one line.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  error,
  className,
  minWidthClass = 'min-w-[7rem] max-w-[12rem]',
  id,
  disabled,
  'aria-label': ariaLabel,
}: SelectProps) {
  const autoId = useId()
  const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : autoId)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value && !o.disabled)
  const enabledOptions = options.filter((o) => !o.disabled)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!open) {
      setHighlight(-1)
      return
    }
    const idx = enabledOptions.findIndex((o) => o.value === value)
    setHighlight(idx >= 0 ? idx : 0)
  }, [open, value, enabledOptions])

  const pick = (opt: SelectOption) => {
    if (opt.disabled) return
    onChange(opt.value)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const opt = enabledOptions[highlight]
      if (opt) pick(opt)
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setHighlight((h) => {
        if (enabledOptions.length === 0) return -1
        if (e.key === 'ArrowDown') return Math.min(enabledOptions.length - 1, Math.max(0, h) + 1)
        return Math.max(0, (h < 0 ? 0 : h) - 1)
      })
    }
  }

  const rows: Array<{ type: 'group'; label: string } | { type: 'option'; option: SelectOption }> = []
  let lastGroup: string | undefined
  for (const opt of options) {
    if (opt.group && opt.group !== lastGroup) {
      rows.push({ type: 'group', label: opt.group })
      lastGroup = opt.group
    }
    rows.push({ type: 'option', option: opt })
  }

  return (
    <div ref={rootRef} className={cn('relative min-w-0 shrink', minWidthClass, className)}>
      {label ? (
        <label htmlFor={selectId} className="block text-label-sm text-on-surface-variant mb-1.5">
          {label}
        </label>
      ) : null}

      <button
        type="button"
        id={selectId}
        aria-label={ariaLabel ?? placeholder ?? label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full h-9 px-3 flex items-center justify-between gap-2',
          'bg-surface-container-lowest border rounded-lg',
          'text-body-sm text-on-surface text-left',
          'transition-colors duration-200',
          'focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open && 'border-secondary ring-1 ring-secondary/40',
          error ? 'border-error' : 'border-outline-variant',
        )}
      >
        <span className={cn('truncate min-w-0', !selected && 'text-on-surface-variant')}>
          {selected?.label ?? placeholder}
        </span>
        <span
          className={cn(
            'material-symbols-outlined text-on-surface-variant text-[18px] shrink-0 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        >
          expand_more
        </span>
      </button>

      {open && !disabled ? (
        <div
          className={cn(
            'absolute z-50 mt-2 w-full min-w-[10rem]',
            'bg-surface-container-lowest rounded-xl border border-outline-variant/50',
            'executive-shadow overflow-hidden',
          )}
          role="presentation"
        >
          <ul
            role="listbox"
            aria-labelledby={selectId}
            className="py-1 max-h-[240px] overflow-y-auto"
          >
            {rows.map((row, i) => {
              if (row.type === 'group') {
                return (
                  <li
                    key={`g-${row.label}-${i}`}
                    className={cn(
                      'px-4 py-2 text-label-sm uppercase tracking-wider text-on-surface-variant',
                      i > 0 && 'mt-1 border-t border-outline-variant/20',
                    )}
                    role="presentation"
                  >
                    {row.label}
                  </li>
                )
              }

              const opt = row.option
              const isSelected = opt.value === value
              const enabledIdx = enabledOptions.findIndex((o) => o.value === opt.value)
              const isHighlighted = !opt.disabled && enabledIdx === highlight

              return (
                <li key={opt.value} role="option" aria-selected={isSelected} aria-disabled={opt.disabled}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    onMouseEnter={() => {
                      if (!opt.disabled && enabledIdx >= 0) setHighlight(enabledIdx)
                    }}
                    onClick={() => pick(opt)}
                    className={cn(
                      'w-full h-11 px-4 flex items-center justify-between gap-2',
                      'text-body-md text-left transition-colors duration-200',
                      opt.disabled && 'opacity-50 cursor-not-allowed',
                      !opt.disabled && !isSelected && isHighlighted && 'bg-surface-container-low',
                      !opt.disabled &&
                        !isSelected &&
                        !isHighlighted &&
                        'hover:bg-surface-container-low cursor-pointer',
                      isSelected && 'bg-secondary-container text-secondary font-medium',
                      !isSelected && 'text-on-surface',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
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
            })}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="mt-1 text-label-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
