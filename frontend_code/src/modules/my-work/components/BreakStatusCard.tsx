import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import {
  formatDuration,
  getActiveBreak,
  getBreakHistory,
  getElapsedMs,
  getRemainingMs,
  isBreakRunning,
  stopBreak,
  subscribeBreakChange,
  syncCountdownExpiry,
  type BreakSession,
} from '../lib/break-session'
import { cn } from '@/shared/lib/cn'

export function BreakStatusCard() {
  const navigate = useNavigate()
  const [active, setActive] = useState<BreakSession | null>(() => getActiveBreak())
  const [history, setHistory] = useState<BreakSession[]>(() => getBreakHistory())
  const [, setTick] = useState(0)

  const refresh = () => {
    setActive(syncCountdownExpiry(getActiveBreak()))
    setHistory(getBreakHistory())
  }

  useEffect(() => {
    refresh()
    return subscribeBreakChange(refresh)
  }, [])

  useEffect(() => {
    if (!isBreakRunning(active)) return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
      setActive(syncCountdownExpiry(getActiveBreak()))
    }, 1000)
    return () => window.clearInterval(id)
  }, [active?.id, active?.endedAt])

  const running = isBreakRunning(active)
  const last = history[0]

  return (
    <section
      className={cn(
        'rounded-xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4',
        running
          ? 'bg-secondary/5 border-secondary/30'
          : 'bg-surface-container-lowest border-outline-variant'
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            running ? 'bg-secondary text-on-secondary' : 'bg-secondary/10 text-secondary'
          )}
        >
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">
            coffee
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-title-md font-semibold text-on-background">
            {running ? 'On a break' : 'Breaks'}
          </h3>
          {running && active ? (
            <p className="text-body-sm text-on-surface-variant tabular-nums">
              {active.mode === 'countdown'
                ? `Remaining ${formatDuration(getRemainingMs(active) ?? 0)}`
                : `Elapsed ${formatDuration(getElapsedMs(active))}`}
              {active.note ? ` · ${active.note}` : ''}
            </p>
          ) : last ? (
            <p className="text-body-sm text-on-surface-variant">
              Last break {formatDuration(getElapsedMs(last))}
              {last.endedAt
                ? ` · ended ${new Date(last.endedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </p>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              No breaks yet today. Use the header or start one here.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {running ? (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/my-work/break' })}>
              Open
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                stopBreak()
                refresh()
              }}
            >
              End break
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/my-work/break' })}>
            Take a break
          </Button>
        )}
      </div>
    </section>
  )
}
