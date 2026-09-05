import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AuthUser, LoginInput } from '../schemas/auth'
import { loginApi, logoutApi, persistSession } from '../api/auth'
import {
  can as rbacCan,
  getCurrentEmploymentId,
  fetchEffectiveAuthorization,
  invalidateRbac,
} from '@/shared/rbac'
import { queryKeys } from '@/shared/lib/query-keys'
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
  const queryClient = useQueryClient()

  const employmentId = session?.user?.employmentId ?? getCurrentEmploymentId()

  /** Prefetch effective permissions into React Query after session is known. */
  useEffect(() => {
    if (isBootstrapping) return
    if (employmentId == null) {
      invalidateRbac(queryClient)
      return
    }
    void queryClient.prefetchQuery({
      queryKey: queryKeys.rbac.effective(employmentId),
      queryFn: () => fetchEffectiveAuthorization(employmentId),
      staleTime: Infinity,
    })
  }, [employmentId, isBootstrapping, queryClient])

  const login = useCallback(
    async (input: LoginInput) => {
      const next = await loginApi(input)
      setSession(next)
      const eid = next.user.employmentId
      if (eid != null) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.rbac.effective(eid),
          queryFn: () => fetchEffectiveAuthorization(eid),
          staleTime: Infinity,
        })
      }
    },
    [setSession, queryClient],
  )

  const logout = useCallback(
    async (revokeAll = false) => {
      await logoutApi(revokeAll)
      setSession(null)
      invalidateRbac(queryClient)
    },
    [setSession, queryClient],
  )

  const markSessionExpired = useCallback(() => {
    persistSession(null)
    setSession(null)
    invalidateRbac(queryClient)
  }, [setSession, queryClient])

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
