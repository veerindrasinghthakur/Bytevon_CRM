import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthSession } from '../schemas/auth'
import { loadStoredSession, persistSession, refreshApi } from '../api/auth'
import { setCurrentEmploymentId } from '@/shared/rbac'
import { env } from '@/config/env'
import { useEventListener } from '@/shared/hooks/useEventListener'

interface UseAuthBootstrapResult {
  session: AuthSession | null
  isBootstrapping: boolean
  setSession: (session: AuthSession | null) => void
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
  }, [])

  useEffect(() => {
    const stored = loadStoredSession()
    setSessionState(stored)
    setIsBootstrapping(false)
  }, [])

  const handleFocus = useCallback(() => {
    const currentSession = sessionRef.current
    if (!env.useMockApi) return
    if (!currentSession) return

    let inFlight = false
    const onFocus = () => {
      if (inFlight) return
      inFlight = true
      void refreshApi(currentSession.tokens.refreshToken)
        .then(setSessionState)
        .catch(() => {
          // keep session — network blip or offline must not log out
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