import { useEffect, useState } from 'react'
import {
  formatDuration,
  getActiveBreak,
  getElapsedMs,
  getRemainingMs,
  isBreakRunning,
  maybeNotifyCountdownComplete,
  subscribeBreakChange,
} from '@/modules/my-work/lib/break-session'

/** Header break chip — live label only; end-of-break is always user-driven on Take a Break page. */
export function useHeaderBreak() {
  const [runningLabel, setRunningLabel] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      const s = getActiveBreak()
      maybeNotifyCountdownComplete(s)
      if (!isBreakRunning(s) || !s) {
        setRunningLabel(null)
        return
      }
      if (s.mode === 'countdown') {
        const rem = getRemainingMs(s)
        // After planned time hits 0, show elapsed overtime instead of 00:00 stuck
        if (rem === 0) {
          setRunningLabel(`+${formatDuration(getElapsedMs(s) - (s.durationMinutes ?? 0) * 60_000)}`)
        } else {
          setRunningLabel(rem != null ? formatDuration(rem) : null)
        }
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

  return {
    runningLabel,
    isOnBreak: runningLabel != null,
  }
}
