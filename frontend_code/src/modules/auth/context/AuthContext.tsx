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

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
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

  // Optional background refresh when tab focuses (mock)
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isBootstrapping,
      login,
      logout,
      markSessionExpired,
    }),
    [session, isBootstrapping, login, logout, markSessionExpired]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
