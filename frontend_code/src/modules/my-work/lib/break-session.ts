/**
 * Local break session — client-only until backend persists breaks.
 *
 * Countdown timer: when planned duration elapses, fire a notification event
 * but do NOT auto-end the break. Actual break time is measured until the user
 * explicitly stops (checkout) the break.
 */

import type { BreakSession } from '../types'

export type { BreakMode, BreakSession } from '../types'

const ACTIVE_KEY = 'bytevon.activeBreak'
const HISTORY_KEY = 'bytevon.breakHistory'
const MAX_HISTORY = 20
const NOTIFIED_KEY = 'bytevon.breakNotified'

function uid() {
  return `brk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function getActiveBreak(): BreakSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as BreakSession
  } catch {
    return null
  }
}

export function setActiveBreak(session: BreakSession | null) {
  if (session) localStorage.setItem(ACTIVE_KEY, JSON.stringify(session))
  else localStorage.removeItem(ACTIVE_KEY)
  window.dispatchEvent(new Event('bytevon:break-change'))
}

export function getBreakHistory(): BreakSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BreakSession[]
  } catch {
    return []
  }
}

function pushHistory(session: BreakSession) {
  const list = [session, ...getBreakHistory().filter((b) => b.id !== session.id)].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
}

export function startBreak(opts: {
  durationMinutes?: number
  note?: string
}): BreakSession {
  const existing = getActiveBreak()
  if (existing && !existing.endedAt) {
    return existing
  }
  const duration =
    opts.durationMinutes != null && opts.durationMinutes > 0
      ? Math.min(Math.floor(opts.durationMinutes), 24 * 60)
      : undefined
  const session: BreakSession = {
    id: uid(),
    mode: duration ? 'countdown' : 'stopwatch',
    startedAt: new Date().toISOString(),
    durationMinutes: duration,
    note: opts.note?.trim() || undefined,
  }
  // clear prior notify flag for this id
  try {
    const map = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '{}') as Record<string, boolean>
    delete map[session.id]
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
  setActiveBreak(session)
  return session
}

/** User explicitly ends the break — this is the real end time used for payroll/net hours. */
export function stopBreak(): BreakSession | null {
  const active = getActiveBreak()
  if (!active || active.endedAt) {
    setActiveBreak(null)
    return active
  }
  const ended: BreakSession = {
    ...active,
    endedAt: new Date().toISOString(),
  }
  pushHistory(ended)
  setActiveBreak(null)
  return ended
}

/** Elapsed ms since start until end or now (never auto-capped — real duration until user stops). */
export function getElapsedMs(session: BreakSession, now = Date.now()): number {
  const start = new Date(session.startedAt).getTime()
  const end = session.endedAt ? new Date(session.endedAt).getTime() : now
  return Math.max(0, end - start)
}

/** Remaining of planned countdown (UI only). Null for stopwatch. */
export function getRemainingMs(session: BreakSession, now = Date.now()): number | null {
  if (session.mode !== 'countdown' || !session.durationMinutes) return null
  const total = session.durationMinutes * 60 * 1000
  return Math.max(0, total - getElapsedMs(session, now))
}

export function isBreakRunning(session: BreakSession | null): boolean {
  return Boolean(session && !session.endedAt)
}

/**
 * When countdown hits zero, notify once — but keep the break running until stopBreak().
 * Returns whether a notification was just fired.
 */
export function maybeNotifyCountdownComplete(session: BreakSession | null, now = Date.now()): boolean {
  if (!session || session.endedAt || session.mode !== 'countdown') return false
  const rem = getRemainingMs(session, now)
  if (rem !== 0) return false
  try {
    const map = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '{}') as Record<string, boolean>
    if (map[session.id]) return false
    map[session.id] = true
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent('bytevon:break-timer-complete', {
      detail: { breakId: session.id, plannedMinutes: session.durationMinutes },
    }),
  )
  return true
}

/** @deprecated Prefer maybeNotifyCountdownComplete — does not auto-end. */
export function syncCountdownExpiry(session: BreakSession | null): BreakSession | null {
  maybeNotifyCountdownComplete(session)
  return session
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function subscribeBreakChange(cb: () => void) {
  const handler = () => cb()
  window.addEventListener('bytevon:break-change', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('bytevon:break-change', handler)
    window.removeEventListener('storage', handler)
  }
}
