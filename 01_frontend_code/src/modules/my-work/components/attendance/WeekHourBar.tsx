import { cn } from '@/shared/lib/cn'
import type { BreakBarMarker, WeekHourBar } from '../../types'

export function WeekHourBarChart({
  d,
  markers,
}: {
  d: WeekHourBar
  markers: BreakBarMarker[]
}) {
  const height = d.pct > 0 ? `${d.pct}%` : '4px'
  return (
    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
      <div
        className={cn(
          'relative w-full rounded-t-md transition-colors overflow-hidden',
          d.isWeekend
            ? 'bg-outline-variant/50'
            : d.isToday
              ? 'bg-secondary'
              : d.pct > 0
                ? 'bg-secondary/25'
                : 'bg-outline-variant/30',
        )}
        style={{ height }}
        title={`${d.day}: ${d.hours}h${d.isWeekend ? ' (weekend)' : ''}${markers.length ? ` · ${markers.length} break(s)` : ''}`}
      >
        {markers.map((m) => {
          const bottom = m.startPct
          const top = m.endPct ?? m.startPct + 2
          const h = Math.max(2, top - bottom)
          return (
            <span
              key={m.id}
              className="absolute left-0 right-0 bg-error/90 rounded-[1px] pointer-events-none"
              style={{
                bottom: `${bottom}%`,
                height: `${h}%`,
                minHeight: 3,
              }}
              title="Break"
            />
          )
        })}
      </div>
      <span
        className={cn(
          'text-label-sm font-medium',
          d.isWeekend ? 'text-on-surface-variant/70' : 'text-on-surface-variant',
          d.isToday && 'text-secondary font-bold',
        )}
      >
        {d.day}
      </span>
    </div>
  )
}
