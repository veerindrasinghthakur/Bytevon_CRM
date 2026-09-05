import { useLiveClock } from '@/shared/hooks/useLiveClock'

/** Live clock for the shell header — updates every second. */
export function HeaderClock() {
  const { now, timeLabel, dateLabel } = useLiveClock()

  return (
    <div
      className="hidden sm:flex flex-col items-end justify-center leading-none select-none tabular-nums"
      title={now.toLocaleString()}
      aria-live="polite"
      aria-label={`Current time ${timeLabel}`}
    >
      <span className="text-label-md font-semibold text-on-background tracking-wide">{timeLabel}</span>
      <span className="text-[10px] text-on-surface-variant mt-0.5">{dateLabel}</span>
    </div>
  )
}
