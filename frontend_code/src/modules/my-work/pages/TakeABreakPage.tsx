import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { safeNavigate } from '@/shared/lib/safeNavigate'

import {
  formatDuration,
  getActiveBreak,
  getElapsedMs,
  getRemainingMs,
  isBreakRunning,
  startBreak,
  stopBreak,
  subscribeBreakChange,
  syncCountdownExpiry,
  type BreakSession,
} from '../lib/break-session'
import { cn } from '@/shared/lib/cn'

const PRESETS = [5, 10, 15, 30] as const

export function TakeABreakPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<BreakSession | null>(() => getActiveBreak())
  const [minutesInput, setMinutesInput] = useState('')
  const [note, setNote] = useState('')
  const [tick, setTick] = useState(0)

  const refresh = () => {
    const next = syncCountdownExpiry(getActiveBreak())
    setSession(next)
  }

  useEffect(() => {
    refresh()
    return subscribeBreakChange(refresh)
  }, [])

  useEffect(() => {
    if (!isBreakRunning(session)) return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
      const next = syncCountdownExpiry(getActiveBreak())
      setSession(next)
    }, 250)
    return () => window.clearInterval(id)
  }, [session?.id, session?.endedAt, session?.mode])

  const running = isBreakRunning(session)
  const elapsed = session ? getElapsedMs(session) : 0
  const remaining = session ? getRemainingMs(session) : null

  const handleStart = () => {
    const parsed = minutesInput.trim() === '' ? undefined : Number(minutesInput)
    const durationMinutes =
      parsed != null && !Number.isNaN(parsed) && parsed > 0 ? parsed : undefined
    const s = startBreak({ durationMinutes, note })
    setSession(s)
    setMinutesInput('')
  }

  const handleStop = () => {
    stopBreak()
    setSession(null)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Take a Break"
        description="Step away with a timed break, or start a free stopwatch and stop when you are back."
      />

      <div
        className={cn(
          'rounded-2xl border executive-shadow p-8 flex flex-col items-center text-center gap-4',
          running
            ? 'bg-secondary/5 border-secondary/30'
            : 'bv-surface'
        )}
      >
        <span
          className="material-symbols-outlined text-5xl text-secondary"
          aria-hidden="true"
        >
          {running ? 'coffee' : 'self_improvement'}
        </span>

        {running && session ? (
          <>
            <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              {session.mode === 'countdown' ? 'Time remaining' : 'Break running'}
            </p>
            <p className="text-5xl font-bold tabular-nums text-on-background tracking-tight">
              {session.mode === 'countdown' && remaining != null
                ? formatDuration(remaining)
                : formatDuration(elapsed)}
            </p>
            {session.mode === 'countdown' && (
              <p className="text-body-sm text-on-surface-variant">
                Elapsed {formatDuration(elapsed)}
                {session.durationMinutes != null && ` · Planned ${session.durationMinutes} min`}
              </p>
            )}
            {session.note && (
              <p className="text-body-sm text-on-surface-variant italic">“{session.note}”</p>
            )}
            <Button variant="danger" className="mt-2 min-w-[160px]" onClick={handleStop}>
              End break
            </Button>
          </>
        ) : (
          <>
            <p className="text-body-md text-on-surface-variant max-w-sm">
              Enter a duration in minutes, or leave it empty to run a stopwatch until you stop the
              break.
            </p>

            <div className="w-full space-y-4 text-left">
              <div>
                <label className="text-label-sm font-semibold text-on-surface-variant block mb-1.5">
                  Duration (minutes) — optional
                </label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  inputMode="numeric"
                  placeholder="e.g. 15 — or leave blank for stopwatch"
                  value={minutesInput}
                  onChange={(e) => setMinutesInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinutesInput(String(m))}
                      className="px-3 py-1 rounded-full text-label-sm font-medium border border-outline-variant hover:border-secondary hover:bg-secondary/5 text-on-surface transition-colors"
                    >
                      {m} min
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMinutesInput('')}
                    className="px-3 py-1 rounded-full text-label-sm font-medium border border-outline-variant hover:border-secondary hover:bg-secondary/5 text-on-surface-variant transition-colors"
                  >
                    Stopwatch
                  </button>
                </div>
              </div>

              <div>
                <label className="text-label-sm font-semibold text-on-surface-variant block mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="Coffee, walk, lunch…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <Button variant="primary" className="mt-2 min-w-[160px]" onClick={handleStart}>
              Start break
            </Button>
          </>
        )}

        <span className="sr-only">{tick}</span>
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => safeNavigate(navigate,{ to: '/my-work' })}>
          Back to My Work
        </Button>
      </div>
    </div>
  )
}
