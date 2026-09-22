import { useCallback, useEffect, useRef, useState } from 'react'
import { loadStoredSession, persistSession, refreshApi } from '../api/auth'
import { setCurrentEmploymentId } from '@/shared/rbac'
import { notifySessionExpired } from '@/shared/lib/session-expiry'
import { useEventListener } from '@/shared/hooks/useEventListener'
import {UseAuthBootstrapResult} from '../types'
import type { AuthSession } from '../schemas/auth'


function applyEmploymentFromSession(session: AuthSession | null) {
  const employmentId = session?.user?.employmentId
  setCurrentEmploymentId(employmentId != null ? employmentId : null)
}

export function useAuthBootstrap(): UseAuthBootstrapResult {
  const [session, setSessionState] = useState<AuthSession | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const sessionRef = useRef(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const setSession = useCallback((newSession: AuthSession | null) => {
    setSessionState(newSession)
    persistSession(newSession)
    applyEmploymentFromSession(newSession)
  }, [])

  useEffect(() => {
    const stored = loadStoredSession()
    setSessionState(stored)
    applyEmploymentFromSession(stored)
    setIsBootstrapping(false)
  }, [])

  const handleFocus = useCallback(() => {
    const currentSession = sessionRef.current
    if (!currentSession) return

    let inFlight = false
    const onFocus = () => {
      if (inFlight) return
      inFlight = true
      void refreshApi(currentSession.tokens.refreshToken)
        .then((next) => {
          setSessionState(next)
          applyEmploymentFromSession(next)
        })
        .catch((err: unknown) => {
          // Expired refresh token while tab was away → force relogin.
          if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
            notifySessionExpired()
          }
          // Network blips / offline must not log out.
        })
        .finally(() => {
          inFlight = false
        })
    }
    onFocus()
  }, [])

  useEventListener(window, 'focus', handleFocus)

  return { session, isBootstrapping, setSession }
}
