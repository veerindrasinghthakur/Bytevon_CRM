import { useMemo, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { ExecutiveDashboardData } from '../../types/dashboard.types'

const card = 'bv-surface card-hover'

const ATTENDANCE_PERIODS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
] as const

export function ExecutiveTrends({
  meta,
  showAttendance,
  showPipeline,
}: {
  meta: ExecutiveDashboardData['meta']
  showAttendance: boolean
  showPipeline: boolean
}) {
  const [attendanceDays, setAttendanceDays] = useState<number>(30)
  const attendanceBars = useMemo(
    () => meta?.attendanceBars.slice(-attendanceDays) ?? [],
    [meta, attendanceDays],
  )

  if (!showAttendance && !showPipeline) return null
  return (
    <section
      className={cn(
        'grid gap-6',
        showAttendance && showPipeline ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1',
      )}
    >
      {showAttendance && (
        <div className={`${card} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-title-lg font-semibold text-on-surface">Attendance trend</h2>
            <select
              value={attendanceDays}
              onChange={(e) => setAttendanceDays(Number(e.target.value))}
              className="bg-surface border border-outline-variant text-label-sm rounded-lg px-3 py-1.5 outline-none focus:border-secondary transition-colors duration-200 cursor-pointer"
              aria-label="Attendance trend period"
            >
              {ATTENDANCE_PERIODS.map((p) => (
                <option key={p.label} value={p.days}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-h-[240px] flex items-end justify-between gap-2 px-2 pb-2">
            {attendanceBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-secondary/20 hover:bg-secondary rounded-t transition-colors duration-200 cursor-pointer"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {showPipeline && (
        <div className={`${card} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-title-lg font-semibold text-on-surface">Pipeline trend</h2>
            <div className="flex gap-3 text-label-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Actual
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full bg-outline" /> Target
              </span>
            </div>
          </div>
          <div className="min-h-[240px] flex items-end justify-between gap-3 px-4 pb-2">
            {(meta?.revenueBars ?? []).map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 rounded-t-sm transition-colors duration-200 cursor-pointer',
                  i % 3 === 1
                    ? 'bg-secondary'
                    : 'bg-surface-container-highest hover:bg-secondary',
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between px-4 border-t border-outline-variant pt-3 mt-2 text-label-sm text-on-surface-variant">
            {(meta?.months ?? []).map((m, i) => (
              <span key={`${m}-${i}`}>{m}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
