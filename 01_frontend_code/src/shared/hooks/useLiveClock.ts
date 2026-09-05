import { useEffect, useState } from 'react'

export function formatNow(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

/** Live clock — updates every second. */
export function useLiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return {
    now,
    timeLabel: formatNow(now),
    dateLabel: formatDateLabel(now),
  }
}
