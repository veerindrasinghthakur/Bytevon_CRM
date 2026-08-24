import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TimeRangeValue {
  from: string
  to: string
}

export interface TimeRangeFilterProps {
  value: TimeRangeValue
  onChange: (value: TimeRangeValue) => void
  label?: string
  className?: string
  disabled?: boolean
  placeholder?: string
}

function formatDisplay(value: TimeRangeValue): string {
  if (!value.from && !value.to) return ''
  if (value.from && (!value.to || value.to === value.from)) return value.from
  if (value.from && value.to) return `${value.from} – ${value.to}`
  return value.from || value.to
}

/**
 * Compact filter-bar time control (optional — use where needed, e.g. Audit).
 * Same interaction model as DateRangeFilter: icon box → single/range choice → pickers.
 */
export function TimeRangeFilter({
  value,
  onChange,
  label = 'Time',
  className,
  disabled,
  placeholder = 'Time',
}: TimeRangeFilterProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'menu' | 'single' | 'range'>('menu')
  const [draftFrom, setDraftFrom] = useState(value.from)
  const [draftTo, setDraftTo] = useState(value.to)

  useEffect(() => {
    if (!open) return
    setDraftFrom(value.from)
    setDraftTo(value.to)
    if (value.from && value.to && value.from !== value.to) setStep('range')
    else if (value.from || value.to) setStep('single')
    else setStep('menu')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const display = formatDisplay(value)
  const hasValue = Boolean(display)

  const applySingle = (t: string) => {
    onChange({ from: t, to: t })
    setOpen(false)
  }

  const applyRange = () => {
    if (!draftFrom && !draftTo) {
      onChange({ from: '', to: '' })
      setOpen(false)
      return
    }
    const from = draftFrom || draftTo
    const to = draftTo || draftFrom
    if (from && to && from > to) onChange({ from: to, to: from })
    else onChange({ from: from ?? '', to: to ?? '' })
    setOpen(false)
  }

  const clear = (e: MouseEvent) => {
    e.stopPropagation()
    onChange({ from: '', to: '' })
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 min-w-[7.5rem] max-w-[14rem] px-3 py-2 rounded-lg border',
          'border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface',
          'outline-none focus:border-secondary focus:ring-1 focus:ring-secondary',
          'disabled:opacity-50 disabled:pointer-events-none',
          open && 'border-secondary ring-1 ring-secondary',
        )}
      >
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
          schedule
        </span>
        <span
          className={cn(
            'truncate flex-1 text-left',
            hasValue ? 'text-on-surface font-medium' : 'text-on-surface-variant',
          )}
        >
          {hasValue ? display : placeholder}
        </span>
        {hasValue && (
          <span
            role="button"
            tabIndex={-1}
            onClick={clear}
            className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-on-surface shrink-0"
            aria-label="Clear time"
          >
            close
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 top-full left-0 mt-1 min-w-[220px]',
            'rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg p-2',
          )}
        >
          {step === 'menu' && (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-body-sm text-on-surface hover:bg-surface-container-low text-left"
                onClick={() => setStep('single')}
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
                Select time
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-body-sm text-on-surface hover:bg-surface-container-low text-left"
                onClick={() => setStep('range')}
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">timelapse</span>
                Select range
              </button>
            </div>
          )}

          {step === 'single' && (
            <div className="space-y-3 p-1">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  className="text-label-sm text-secondary hover:underline"
                  onClick={() => setStep('menu')}
                >
                  Back
                </button>
                <span className="text-label-sm text-on-surface-variant">Pick a time</span>
              </div>
              <input
                type="time"
                value={draftFrom || value.from}
                onChange={(e) => {
                  setDraftFrom(e.target.value)
                  if (e.target.value) applySingle(e.target.value)
                }}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border border-outline-variant bg-transparent',
                  'text-body-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary',
                )}
                autoFocus
              />
            </div>
          )}

          {step === 'range' && (
            <div className="space-y-3 p-1">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  className="text-label-sm text-secondary hover:underline"
                  onClick={() => setStep('menu')}
                >
                  Back
                </button>
                <span className="text-label-sm text-on-surface-variant">Pick a range</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface-variant">From</span>
                  <input
                    type="time"
                    value={draftFrom}
                    onChange={(e) => setDraftFrom(e.target.value)}
                    className={cn(
                      'w-full px-2 py-2 rounded-lg border border-outline-variant bg-transparent',
                      'text-body-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary',
                    )}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface-variant">To</span>
                  <input
                    type="time"
                    value={draftTo}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className={cn(
                      'w-full px-2 py-2 rounded-lg border border-outline-variant bg-transparent',
                      'text-body-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary',
                    )}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-label-sm text-on-surface-variant hover:bg-surface-container-low"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-label-sm bg-secondary text-on-secondary hover:opacity-90"
                  onClick={applyRange}
                  disabled={!draftFrom && !draftTo}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
