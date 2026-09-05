/** Client-side today attendance for header work-hours summary */

import {
  getActiveBreak,
  getBreakHistory,
  getElapsedMs,
  isBreakRunning,
} from './break-session'
import type { TodayAttendanceSession, WorkHoursSummary } from '../schemas/attendance'

// Re-export types for backward compatibility
export type { TodayAttendanceSession, WorkHoursSummary }

const KEY = 'bytevon.todayAttendance'

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

/**
 * Read today's session. No fake seed — check-in is the exact time the user punched.
 * Returns null when the user has not checked in today.
 */
export function getTodayAttendance(): TodayAttendanceSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TodayAttendanceSession
    if (parsed.date === todayKey() && parsed.checkInAt) return parsed
  } catch {
    /* ignore */
  }
  return null
}

export function setTodayAttendance(session: TodayAttendanceSession) {
  localStorage.setItem(KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('bytevon:attendance-change'))
}

/** Exact wall-clock check-in time (ISO). */
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
  if (!cur) return null
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

/** Total break ms that overlap today's session window (from history + active until user ends break). */
export function getTodayBreakMs(now = Date.now()): number {
  const attendance = getTodayAttendance()
  if (!attendance) return 0
  const windowStart = new Date(attendance.checkInAt).getTime()
  const windowEnd = attendance.checkOutAt
    ? new Date(attendance.checkOutAt).getTime()
    : now

  let total = 0

  const active = getActiveBreak()
  if (active && isBreakRunning(active)) {
    const start = Math.max(new Date(active.startedAt).getTime(), windowStart)
    const end = Math.min(now, windowEnd)
    if (end > start) total += end - start
  }

  for (const b of getBreakHistory()) {
    if (!b.endedAt) continue
    const bStart = new Date(b.startedAt).getTime()
    const bEnd = new Date(b.endedAt).getTime()
    if (new Date(b.startedAt).toISOString().slice(0, 10) !== attendance.date) continue
    const start = Math.max(bStart, windowStart)
    const end = Math.min(bEnd, windowEnd)
    if (end > start) total += end - start
  }

  return total
}

/** Net work = (out|now − in) − breaks in that window. Null when not checked in. */
export function getWorkHoursSummary(now = Date.now()): WorkHoursSummary | null {
  const att = getTodayAttendance()
  if (!att) return null
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

export { getElapsedMs }
