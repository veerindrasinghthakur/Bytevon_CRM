import { useEffect, useState } from 'react'

function formatNow(date: Date) {
  // Exact local time with seconds, 24h for clarity across locales
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

/** Live clock for the shell header — updates every second. */
export function HeaderClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      className="hidden sm:flex flex-col items-end justify-center leading-none select-none tabular-nums"
      title={now.toLocaleString()}
      aria-live="polite"
      aria-label={`Current time ${formatNow(now)}`}
    >
      <span className="text-label-md font-semibold text-on-background tracking-wide">
        {formatNow(now)}
      </span>
      <span className="text-[10px] text-on-surface-variant mt-0.5">
        {formatDateLabel(now)}
      </span>
    </div>
  )
}
