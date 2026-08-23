import { cn } from '@/shared/lib/cn'
import { formatClockTime } from '../../lib/attendance-session'

export type WorkLogRow = {
  id: string
  activity: string
  time: string
  duration: string
  statusLabel: string
  statusTone: 'ok' | 'warn' | 'neutral'
  location: string
}

type BreakSeg = {
  id: string
  startedAt: string
  endedAt?: string | null
}

/** Percent of 24h day for timeline marker (0–100). */
function dayPct(iso: string, now = Date.now()): number {
  const d = new Date(iso)
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const ms = Math.min(now, d.getTime()) - start.getTime()
  return Math.min(100, Math.max(0, (ms / 86_400_000) * 100))
}

export function WorkingHoursLog({
  logRows,
  markerPct,
  totalLoggedLabel,
  breaks,
  nowMs,
}: {
  logRows: WorkLogRow[]
  markerPct: number | null
  totalLoggedLabel: string
  breaks: BreakSeg[]
  nowMs: number
}) {
  return (
    <div className="col-span-12 bv-surface p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h3 className="text-title-lg font-semibold text-on-background">Working Hours Log</h3>
        <div className="text-label-md text-on-surface-variant">
          Total net:{' '}
          <span className="font-bold text-secondary">{totalLoggedLabel} logged today</span>
        </div>
      </div>

      <div className="relative h-16 bg-surface-container rounded-full overflow-hidden mb-6">
        <div className="absolute inset-0 flex text-[10px] text-on-surface-variant/50 pointer-events-none">
          <div className="w-[37.5%] border-r border-white/40 flex items-center justify-center">
            00:00 – 09:00
          </div>
          <div className="w-[37.5%] border-r border-white/40 flex items-center justify-center">
            09:00 – 18:00
          </div>
          <div className="flex-1 flex items-center justify-center">18:00 – 24:00</div>
        </div>
        {markerPct != null && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-secondary executive-shadow z-10"
            style={{ left: `${markerPct}%` }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-secondary rounded-full" />
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-secondary whitespace-nowrap">
              In
            </span>
          </div>
        )}
        {breaks.map((b) => {
          const startPct = dayPct(b.startedAt, nowMs)
          const endPct = b.endedAt
            ? dayPct(b.endedAt, nowMs)
            : dayPct(new Date(nowMs).toISOString(), nowMs)
          const width = Math.max(0.5, endPct - startPct)
          return (
            <div
              key={b.id}
              className="absolute top-2 bottom-2 rounded bg-error/70 z-[5]"
              style={{ left: `${startPct}%`, width: `${width}%` }}
              title={`Break ${formatClockTime(b.startedAt)}`}
            />
          )
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-label-sm text-on-surface-variant border-b border-outline-variant uppercase">
            <tr>
              <th className="pb-3 font-bold">Activity</th>
              <th className="pb-3 font-bold">Time</th>
              <th className="pb-3 font-bold">Duration</th>
              <th className="pb-3 font-bold">Status</th>
              <th className="pb-3 font-bold">Location / Note</th>
            </tr>
          </thead>
          <tbody className="text-body-sm divide-y divide-outline-variant/30">
            {logRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                  No punches yet today. Check in to start the log.
                </td>
              </tr>
            ) : (
              logRows.map((row) => (
                <tr key={row.id} className="zebra-row">
                  <td className="py-4 font-medium">{row.activity}</td>
                  <td className="py-4">{row.time}</td>
                  <td className="py-4">{row.duration}</td>
                  <td className="py-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-md text-[10px] font-bold uppercase',
                        row.statusTone === 'ok' && 'bg-emerald-100 text-emerald-800',
                        row.statusTone === 'warn' && 'bg-amber-100 text-amber-800',
                        row.statusTone === 'neutral' &&
                          'bg-surface-container text-on-surface-variant',
                      )}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="py-4 text-on-surface-variant">{row.location}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
