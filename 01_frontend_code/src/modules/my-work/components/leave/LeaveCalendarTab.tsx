import { useMemo } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useLeaveCalculations } from '../../hooks/useLeaveCalculations'
import type { LeaveHistoryRow } from '../../types'

type CalendarLeave = Pick<
  LeaveHistoryRow,
  'id' | 'type' | 'from' | 'to' | 'status' | 'reason'
>

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayISO() {
  const n = new Date()
  return toISO(n.getFullYear(), n.getMonth(), n.getDate())
}

function formatHoliday(iso: string, name: string) {
  const d = new Date(iso + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return name || iso
  return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`
}

export function LeaveCalendarTab({
  calMonth,
  setCalMonth,
  totalRemaining,
  requests,
}: {
  calMonth: Date
  setCalMonth: (d: Date) => void
  totalRemaining: number
  requests: CalendarLeave[]
}) {
  const { holidays } = useLeaveCalculations()
  const cy = calMonth.getFullYear()
  const cm = calMonth.getMonth()
  const firstDow = new Date(cy, cm, 1).getDay()
  const daysInMonth = new Date(cy, cm + 1, 0).getDate()
  const monthLabel = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = todayISO()

  const nextHoliday = useMemo(() => {
    const upcoming = Object.entries(holidays)
      .filter(([iso]) => iso >= today)
      .sort(([a], [b]) => (a < b ? -1 : 1))[0]
    if (!upcoming) return null
    return formatHoliday(upcoming[0], upcoming[1])
  }, [holidays, today])

  const calendarCells = useMemo(() => {
    const cells: {
      day: number | null
      iso: string | null
      weekend: boolean
      holiday?: string
      leaves: CalendarLeave[]
      isToday: boolean
    }[] = []
    for (let i = 0; i < firstDow; i++) {
      cells.push({ day: null, iso: null, weekend: false, leaves: [], isToday: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(cy, cm, d)
      const dow = new Date(cy, cm, d).getDay()
      const leaves = requests.filter(
        (r) =>
          (r.status === 'Approved' || r.status === 'Pending') && iso >= r.from && iso <= r.to,
      )
      cells.push({
        day: d,
        iso,
        weekend: dow === 0 || dow === 6,
        holiday: holidays[iso],
        leaves,
        isToday: iso === today,
      })
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null, weekend: false, leaves: [], isToday: false })
    }
    return cells
  }, [cy, cm, firstDow, daysInMonth, today, holidays])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Leave Calendar</h2>
          <p className="text-body-md text-on-surface-variant">Your availability for {monthLabel}</p>
        </div>
        <div className="flex items-center gap-1 bv-surface p-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const n = new Date()
              setCalMonth(new Date(n.getFullYear(), n.getMonth(), 1))
            }}
          >
            Today
          </Button>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-surface-container-low transition-colors"
            aria-label="Previous month"
            onClick={() => setCalMonth(new Date(cy, cm - 1, 1))}
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <span className="px-3 text-label-md font-semibold min-w-[140px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-surface-container-low transition-colors"
            aria-label="Next month"
            onClick={() => setCalMonth(new Date(cy, cm + 1, 1))}
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/10 text-secondary text-label-sm font-semibold border border-secondary/20">
          <span className="w-2 h-2 rounded-full bg-secondary" /> Approved leave
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-label-sm font-semibold border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Upcoming / Pending
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-label-sm font-semibold border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-400" /> Weekend
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-100 text-violet-800 text-label-sm font-semibold border border-violet-200">
          <span className="w-2 h-2 rounded-full bg-violet-500" /> Holiday
        </span>
      </div>

      <div className="bv-surface overflow-hidden rounded-2xl">
        <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="py-3 text-center text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarCells.map((cell, i) => {
            if (cell.day === null) {
              return (
                <div
                  key={`e-${i}`}
                  className="min-h-[96px] p-2 border-r border-b border-outline-variant/20 bg-surface-container-low/20"
                />
              )
            }
            const hasPending = cell.leaves.some((l) => l.status === 'Pending')
            const hasApproved = cell.leaves.some((l) => l.status === 'Approved')
            return (
              <div
                key={cell.iso}
                className={`min-h-[96px] p-2 border-r border-b border-outline-variant/20 transition-colors ${
                  cell.holiday
                    ? 'bg-violet-50'
                    : cell.weekend
                      ? 'bg-slate-50'
                      : cell.isToday
                        ? 'bg-secondary/5 ring-1 ring-inset ring-secondary/30'
                        : 'hover:bg-surface-container-low/40'
                }`}
              >
                <div className="flex items-center gap-1 flex-wrap">
                  <span
                    className={`text-label-md font-semibold ${
                      cell.isToday
                        ? 'text-secondary'
                        : cell.holiday
                          ? 'text-violet-800'
                          : cell.weekend
                            ? 'text-slate-500'
                            : 'text-on-surface'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {cell.isToday && (
                    <span className="text-[10px] text-secondary font-bold">Today</span>
                  )}
                  {cell.holiday && (
                    <span className="text-[10px] text-violet-700 font-medium truncate max-w-full">
                      {cell.holiday}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 space-y-1">
                  {cell.leaves.slice(0, 2).map((r) => (
                    <div
                      key={r.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                        r.status === 'Pending'
                          ? 'bg-amber-400 text-amber-950'
                          : r.type === 'Sick'
                            ? 'bg-orange-500 text-white'
                            : 'bg-secondary text-white'
                      }`}
                      title={`${r.type} · ${r.status}: ${r.reason}`}
                    >
                      {r.status === 'Pending' ? 'Pending' : r.type}
                    </div>
                  ))}
                  {(hasPending || hasApproved) && cell.leaves.length > 2 && (
                    <span className="text-[10px] text-on-surface-variant">
                      +{cell.leaves.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bv-surface p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-3xl">group</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Your pending</p>
            <p className="text-headline-md font-bold text-on-background">
              {requests.filter((r) => r.status === 'Pending').length} request(s)
            </p>
          </div>
        </div>
        <div className="bv-surface p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <span className="material-symbols-outlined text-3xl">pending_actions</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Remaining balance</p>
            <p className="text-headline-md font-bold text-on-background">{totalRemaining} days</p>
          </div>
        </div>
        <div className="bv-surface p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <span className="material-symbols-outlined text-3xl">celebration</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Next holiday</p>
            <p className="text-headline-md font-bold text-on-background">{nextHoliday ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
