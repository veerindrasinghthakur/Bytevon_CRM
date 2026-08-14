import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import {
  formatDuration,
  getActiveBreak,
  getElapsedMs,
  getRemainingMs,
  isBreakRunning,
  subscribeBreakChange,
  syncCountdownExpiry,
} from '@/modules/my-work/lib/break-session'

interface HeaderBreakChipProps {
  active?: boolean
}

/** “Take a Break” control — left of the header clock. */
export function HeaderBreakChip({ active }: HeaderBreakChipProps) {
  const [runningLabel, setRunningLabel] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      const s = syncCountdownExpiry(getActiveBreak())
      if (!isBreakRunning(s) || !s) {
        setRunningLabel(null)
        return
      }
      if (s.mode === 'countdown') {
        const rem = getRemainingMs(s)
        setRunningLabel(rem != null ? formatDuration(rem) : null)
      } else {
        setRunningLabel(formatDuration(getElapsedMs(s)))
      }
    }
    update()
    const id = window.setInterval(update, 1000)
    const unsub = subscribeBreakChange(update)
    return () => {
      window.clearInterval(id)
      unsub()
    }
  }, [])

  const isOnBreak = runningLabel != null

  return (
    <Link
      to="/my-work/break"
      title={isOnBreak ? `On break · ${runningLabel}` : 'Take a break'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-label-sm font-semibold',
        'border transition-colors select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue',
        isOnBreak || active
          ? 'bg-secondary/10 border-secondary/40 text-secondary'
          : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-secondary/40 hover:text-secondary'
      )}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
        coffee
      </span>
      <span className="hidden md:inline">{isOnBreak ? runningLabel : 'Take a break'}</span>
      {isOnBreak && (
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse md:hidden" aria-hidden />
      )}
    </Link>
  )
}
