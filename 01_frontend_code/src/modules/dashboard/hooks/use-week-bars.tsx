import { cn } from '@/shared/lib/cn'
import { WEEK_LABELS } from '../lib/dashboard-calendar'
import type {
  UseWeekBarsOptions,
  UseWeekBarsReturn,
} from '../types/dashboard.types'

export function useWeekBars({ weekBars, todayIndex }: UseWeekBarsOptions): UseWeekBarsReturn {
  const weekBarElements = weekBars.map((bar, i) => {
    const pct = typeof bar === 'number' ? bar : bar.pct
    const isWeekend = typeof bar === 'object' && Boolean(bar.isWeekend)
    const markers = typeof bar === 'object' ? (bar.breakMarkers ?? []) : []
    const isToday = i === todayIndex
    const label = WEEK_LABELS[i] ?? `D${i + 1}`

    return (
      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
        <div
          className={cn(
            'relative w-full rounded-t-md transition-colors min-h-[4px] overflow-hidden',
            isWeekend
              ? 'bg-outline-variant/55'
              : isToday
                ? 'bg-secondary'
                : 'bg-secondary/25 hover:bg-secondary/40',
          )}
          style={{ height: `${Math.max(pct, 4)}%` }}
          title={`${label}${isWeekend ? ' (weekend)' : ''}: ${pct}%${markers.length ? ` · ${markers.length} break(s)` : ''}`}
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
              />
            )
          })}
        </div>
        <span
          className={cn(
            'text-[10px] font-medium',
            isWeekend ? 'text-on-surface-variant/70' : 'text-on-surface-variant',
            isToday && 'text-secondary font-bold',
          )}
        >
          {label}
        </span>
      </div>
    )
  })

  return { weekBarElements }
}