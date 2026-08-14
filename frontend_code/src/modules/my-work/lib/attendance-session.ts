/** Client-side today attendance for header work-hours summary */

import {
  getActiveBreak,
  getBreakHistory,
  getElapsedMs,
  isBreakRunning,
  syncCountdownExpiry,
} from './break-session'

export interface TodayAttendanceSession {
  /** ISO date YYYY-MM-DD */
  date: string
  /** ISO timestamp */
  checkInAt: string
  /** ISO timestamp when checked out */
  checkOutAt?: string
}

const KEY = 'bytevon.todayAttendance'

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

/** Default seed: checked in ~4.5h ago (matches previous mock UX) if nothing stored */
function seedDefault(): TodayAttendanceSession {
  const now = Date.now()
  const checkInAt = new Date(now - 4.5 * 60 * 60 * 1000).toISOString()
  return { date: todayKey(), checkInAt }
}

export function getTodayAttendance(): TodayAttendanceSession {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as TodayAttendanceSession
      if (parsed.date === todayKey() && parsed.checkInAt) return parsed
    }
  } catch {
    /* ignore */
  }
  const seeded = seedDefault()
  localStorage.setItem(KEY, JSON.stringify(seeded))
  return seeded
}

export function setTodayAttendance(session: TodayAttendanceSession) {
  localStorage.setItem(KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('bytevon:attendance-change'))
}

export function checkInNow() {
  const session: TodayAttendanceSession = {
    date: todayKey(),
    checkInAt: new Date().toISOString(),
  }
  setTodayAttendance(session)
  return session
}

export function checkOutNow() {
  const cur = getTodayAttendance()
  if (cur.checkOutAt) return cur
  const session = { ...cur, checkOutAt: new Date().toISOString() }
  setTodayAttendance(session)
  return session
}

export function subscribeAttendanceChange(cb: () => void) {
  const handler = () => cb()
  window.addEventListener('bytevon:attendance-change', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('bytevon:attendance-change', handler)
    window.removeEventListener('storage', handler)
  }
}

export function formatClockTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/** Total break ms that overlap today's session window */
export function getTodayBreakMs(now = Date.now()): number {
  const attendance = getTodayAttendance()
  const windowStart = new Date(attendance.checkInAt).getTime()
  const windowEnd = attendance.checkOutAt
    ? new Date(attendance.checkOutAt).getTime()
    : now

  let total = 0

  const active = syncCountdownExpiry(getActiveBreak())
  if (active && isBreakRunning(active)) {
    const start = Math.max(new Date(active.startedAt).getTime(), windowStart)
    const end = Math.min(now, windowEnd)
    if (end > start) total += end - start
  }

  for (const b of getBreakHistory()) {
    if (!b.endedAt) continue
    const bStart = new Date(b.startedAt).getTime()
    const bEnd = new Date(b.endedAt).getTime()
    // Same calendar day as attendance
    if (new Date(b.startedAt).toISOString().slice(0, 10) !== attendance.date) continue
    const start = Math.max(bStart, windowStart)
    const end = Math.min(bEnd, windowEnd)
    if (end > start) total += end - start
  }

  return total
}

export interface WorkHoursSummary {
  checkInAt: string
  checkOutAt?: string
  grossMs: number
  breakMs: number
  netMs: number
}

/** Net work = (out|now − in) − breaks in that window */
export function getWorkHoursSummary(now = Date.now()): WorkHoursSummary {
  const att = getTodayAttendance()
  const start = new Date(att.checkInAt).getTime()
  const end = att.checkOutAt ? new Date(att.checkOutAt).getTime() : now
  const grossMs = Math.max(0, end - start)
  const breakMs = Math.min(getTodayBreakMs(now), grossMs)
  const netMs = Math.max(0, grossMs - breakMs)
  return {
    checkInAt: att.checkInAt,
    checkOutAt: att.checkOutAt,
    grossMs,
    breakMs,
    netMs,
  }
}

export function formatHoursCompact(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h <= 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// re-export for callers that need elapsed helpers
export { getElapsedMs }
