/**
 * Session-expiry event bus — bridges non-React code (axios interceptor)
 * to in-app handling (AuthContext + router navigate).
 *
 * Single-flight: parallel 401s trigger exactly one expiry flow.
 * Loop guards: never fires on /login or /session-expired itself.
 */

type Listener = () => void

const listeners = new Set<Listener>()
let inFlight = false
let lastFiredAt = 0

function currentPath(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname
}

export function subscribeSessionExpired(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Fire-and-forget from interceptors / API layer. Safe to call repeatedly. */
export function notifySessionExpired(): void {
  const path = currentPath()
  if (path.startsWith('/login') || path.startsWith('/session-expired')) return
  const now = Date.now()
  if (inFlight || now - lastFiredAt < 5000) return
  inFlight = true
  lastFiredAt = now
  try {
    listeners.forEach((fn) => {
      try {
        fn()
      } catch {
        // One bad listener must not break the expiry flow.
      }
    })
  } finally {
    inFlight = false
  }
}
