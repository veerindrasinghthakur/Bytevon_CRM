/** Local break session — client-only until backend exists */

export type BreakMode = 'countdown' | 'stopwatch'

export interface BreakSession {
  id: string
  mode: BreakMode
  /** ISO start */
  startedAt: string
  /** Minutes when mode is countdown; undefined for stopwatch */
  durationMinutes?: number
  /** ISO end when stopped or countdown finished */
  endedAt?: string
  note?: string
}

const ACTIVE_KEY = 'bytevon.activeBreak'
const HISTORY_KEY = 'bytevon.breakHistory'
const MAX_HISTORY = 20

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
  setActiveBreak(session)
  return session
}

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

/** Elapsed ms since start (capped at duration for countdown if finished) */
export function getElapsedMs(session: BreakSession, now = Date.now()): number {
  const start = new Date(session.startedAt).getTime()
  const end = session.endedAt ? new Date(session.endedAt).getTime() : now
  return Math.max(0, end - start)
}

export function getRemainingMs(session: BreakSession, now = Date.now()): number | null {
  if (session.mode !== 'countdown' || !session.durationMinutes) return null
  const total = session.durationMinutes * 60 * 1000
  return Math.max(0, total - getElapsedMs(session, now))
}

export function isBreakRunning(session: BreakSession | null, now = Date.now()): boolean {
  if (!session || session.endedAt) return false
  if (session.mode === 'countdown') {
    const rem = getRemainingMs(session, now)
    return rem != null && rem > 0
  }
  return true
}

/** Auto-complete countdown when time hits zero */
export function syncCountdownExpiry(session: BreakSession | null): BreakSession | null {
  if (!session || session.endedAt || session.mode !== 'countdown') return session
  const rem = getRemainingMs(session)
  if (rem === 0) {
    const ended: BreakSession = { ...session, endedAt: new Date().toISOString() }
    pushHistory(ended)
    setActiveBreak(null)
    return null
  }
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
