import { Link } from '@tanstack/react-router'
import { useHeaderAttendance } from '@/shared/hooks/useHeaderAttendance'
import { cn } from '@/shared/lib/cn'

export function HeaderAttendanceSummary() {
  const { summary, checkedOut, formatClockTime, formatHoursCompact } = useHeaderAttendance()

  return (
    <Link
      to={"/my-work/attendance/mark" as any}
      title="Open attendance — work hours exclude breaks"
      className={cn(
        'hidden sm:flex items-center gap-2 lg:gap-3 select-none',
        'rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1',
        'hover:border-secondary/40 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue'
      )}
    >
      <Stat
        label="In"
        value={summary ? formatClockTime(summary.checkInAt) : '—'}
        tone="text-secondary"
      />
      <Divider />
      <Stat
        label="Out"
        value={summary && checkedOut && summary.checkOutAt ? formatClockTime(summary.checkOutAt) : '—'}
        tone={checkedOut ? 'text-on-background' : 'text-on-surface-variant'}
      />
      <Divider />
      <div className="flex flex-col items-end leading-none min-w-[4.5rem]">
        <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Work</span>
        <span className="text-label-md font-bold tabular-nums text-on-background">
          {summary ? formatHoursCompact(summary.netMs) : '—'}
        </span>
        {summary && summary.breakMs > 0 && (
          <span className="text-[9px] text-on-surface-variant mt-0.5 tabular-nums">
            −{formatHoursCompact(summary.breakMs)} break
          </span>
        )}
      </div>
    </Link>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="flex flex-col leading-none">
      <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className={cn('text-label-md font-semibold tabular-nums', tone)}>{value}</span>
    </div>
  )
}

function Divider() {
  return <span className="w-px h-7 bg-outline-variant shrink-0" aria-hidden />
}
