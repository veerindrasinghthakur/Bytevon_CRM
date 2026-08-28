import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { loadStoredSession } from './api/auth'

const LoginPage = lazyPage(() => import('./pages/LoginPage'), 'LoginPage')
const ForgotPasswordPage = lazyPage(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = lazyPage(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage')
const SessionExpiredPage = lazyPage(() => import('./pages/SessionExpiredPage'), 'SessionExpiredPage')
const AccessDeniedPage = lazyPage(() => import('./pages/AccessDeniedPage'), 'AccessDeniedPage')
const NotFoundPage = lazyPage(() => import('./pages/NotFoundPage'), 'NotFoundPage')

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const authRoutes = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  sessionExpired: '/session-expired',
  accessDenied: '/access-denied',
  notFound: '/not-found',
  dashboard: '/dashboard',
} as const

function requireGuest() {
  const session = loadStoredSession()
  if (session) {
    throw redirect({ to: authRoutes.dashboard })
  }
}

/**
 * Public auth routes under AuthLayout (no AppShell).
 * Parent must be the auth layout route.
 */
export function createAuthRoutes<TParent extends AnyRoute>(authLayoutRoute: TParent) {
  return [
    createRoute({
      getParentRoute: () => authLayoutRoute,
      path: authRoutes.login,
      beforeLoad: () => {
        requireGuest()
      },
      validateSearch: (search: Record<string, unknown>) => ({
        redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
      }),
      component: LoginPage,
    }),
    createRoute({
      getParentRoute: () => authLayoutRoute,
      path: authRoutes.forgotPassword,
      beforeLoad: () => {
        requireGuest()
      },
      component: ForgotPasswordPage,
    }),
    createRoute({
      getParentRoute: () => authLayoutRoute,
      path: authRoutes.resetPassword,
      validateSearch: (search: Record<string, unknown>) => ({
        token: typeof search.token === 'string' ? search.token : undefined,
      }),
      component: ResetPasswordPage,
    }),
    createRoute({
      getParentRoute: () => authLayoutRoute,
      path: authRoutes.sessionExpired,
      component: SessionExpiredPage,
    }),
    createRoute({
      getParentRoute: () => authLayoutRoute,
      path: authRoutes.accessDenied,
      component: AccessDeniedPage,
    }),
    createRoute({
      getParentRoute: () => authLayoutRoute,
      path: authRoutes.notFound,
      component: NotFoundPage,
    }),
  ]
}
