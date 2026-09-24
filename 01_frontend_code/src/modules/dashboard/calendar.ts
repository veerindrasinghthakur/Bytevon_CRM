/**
 * Dashboard calendar helpers — single source for day labels and month grids.
 * Grids are computed from the live date (today highlighted); deadline content
 * must come from live API data (pending approvals), never hardcoded events.
 */

export const CALENDAR_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

export const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export const ATTENDANCE_TREND_PERIODS = ['Last 30 Days', 'Last Quarter', 'Year to Date'] as const

export type CalendarCell = {
  key: string
  day: number | null
  isToday: boolean
}

/** Build a 7-column grid for the given month (null = leading/trailing pad). */
export function buildMonthGrid(base: Date = new Date()): CalendarCell[] {
  const y = base.getFullYear()
  const m = base.getMonth()
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const today = new Date()
  const isThisMonth = today.getFullYear() === y && today.getMonth() === m
  const cells: CalendarCell[] = []
  for (let i = 0; i < firstDow; i++) {
    cells.push({ key: `pad-start-${i}`, day: null, isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      key: `day-${d}`,
      day: d,
      isToday: isThisMonth && today.getDate() === d,
    })
  }
  let pad = 0
  while (cells.length % 7 !== 0) {
    cells.push({ key: `pad-end-${pad}`, day: null, isToday: false })
    pad += 1
  }
  return cells
}
