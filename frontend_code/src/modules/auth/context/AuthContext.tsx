import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSession, AuthUser, LoginInput } from '../schemas/auth'
import {
  loadStoredSession,
  loginApi,
  logoutApi,
  persistSession,
  refreshApi,
} from '../api/auth'
import { can as rbacCan, getCurrentEmploymentId } from '@/shared/rbac'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  /** Schema employment id for current session */
  employmentId: number | null
  can: (action: Action | string, resource: ResourceName | string, minScope?: ScopeName | string) => boolean
  login: (input: LoginInput) => Promise<void>
  logout: (revokeAll?: boolean) => Promise<void>
  markSessionExpired: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    const stored = loadStoredSession()
    setSession(stored)
    setIsBootstrapping(false)
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const next = await loginApi(input)
    setSession(next)
  }, [])

  const logout = useCallback(async (revokeAll = false) => {
    await logoutApi(revokeAll)
    setSession(null)
  }, [])

  const markSessionExpired = useCallback(() => {
    persistSession(null)
    setSession(null)
  }, [])

  useEffect(() => {
    if (!session) return
    const onFocus = () => {
      void refreshApi(session.tokens.refreshToken).then(setSession).catch(() => {
        markSessionExpired()
      })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [session, markSessionExpired])

  const employmentId = session?.user.employmentId ?? getCurrentEmploymentId()

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isBootstrapping,
      employmentId,
      can: (action, resource, minScope) =>
        rbacCan({
          action,
          resource,
          minScope,
          employmentId: employmentId ?? undefined,
        }),
      login,
      logout,
      markSessionExpired,
    }),
    [session, isBootstrapping, employmentId, login, logout, markSessionExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
