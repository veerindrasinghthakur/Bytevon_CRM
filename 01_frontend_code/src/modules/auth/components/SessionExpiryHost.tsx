/**
 * In-app session-expiry handler — mounted once inside AppShell (under RouterProvider).
 * On expiry: clears AuthContext + React Query + RBAC caches, navigates to
 * /session-expired?redirect=<here> without a full page reload.
 */
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { subscribeSessionExpired } from '@/shared/lib/session-expiry'
import { setCurrentEmploymentId } from '@/shared/rbac'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { authRoutes } from '../routes'

export function SessionExpiryHost() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { markSessionExpired } = useAuth()

  useEffect(
    () =>
      subscribeSessionExpired(() => {
        markSessionExpired()
        queryClient.clear()
        setCurrentEmploymentId(null)
        const redirect =
          typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : '/dashboard'
        safeNavigate(navigate, {
          to: authRoutes.sessionExpired,
          search: { redirect },
        })
      }),
    [markSessionExpired, navigate, queryClient],
  )

  return null
}
