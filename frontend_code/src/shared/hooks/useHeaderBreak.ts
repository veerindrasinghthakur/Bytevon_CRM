import { useEffect, useState } from 'react'
import {
  formatDuration,
  getActiveBreak,
  getElapsedMs,
  getRemainingMs,
  isBreakRunning,
  subscribeBreakChange,
  syncCountdownExpiry,
} from '@/modules/my-work/lib/break-session'

/** Header break chip state — live countdown / elapsed while on break. */
export function useHeaderBreak() {
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

  return {
    runningLabel,
    isOnBreak: runningLabel != null,
  }
}
