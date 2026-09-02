import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import type { AuthUser, LoginInput } from '../schemas/auth'
import { loginApi, logoutApi, persistSession } from '../api/auth'
import { can as rbacCan, getCurrentEmploymentId } from '@/shared/rbac'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'
import { useAuthBootstrap } from '../hooks/useAuthBootstrap'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  employmentId: number | null
  can: (action: Action, resource: ResourceName, minScope?: ScopeName) => boolean
  login: (input: LoginInput) => Promise<void>
  logout: (revokeAll?: boolean) => Promise<void>
  markSessionExpired: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, isBootstrapping, setSession } = useAuthBootstrap()

  const login = useCallback(async (input: LoginInput) => {
    const next = await loginApi(input)
    setSession(next)
  }, [setSession])

  const logout = useCallback(async (revokeAll = false) => {
    await logoutApi(revokeAll)
    setSession(null)
  }, [setSession])

  const markSessionExpired = useCallback(() => {
    persistSession(null)
    setSession(null)
  }, [setSession])

  const employmentId = session?.user?.employmentId ?? getCurrentEmploymentId()

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
    [session, isBootstrapping, employmentId, login, logout, markSessionExpired]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}