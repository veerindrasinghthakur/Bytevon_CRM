import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ProfilePage = lazyPage(() => import('./pages/ProfilePage'), 'ProfilePage')
const ActiveSessionsPage = lazyPage(() => import('./pages/ActiveSessionsPage'), 'ActiveSessionsPage')
const ChangePasswordPage = lazyPage(() => import('./pages/ChangePasswordPage'), 'ChangePasswordPage')

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const profileRoutes = {
  root: '/profile',
  sessions: '/profile/sessions',
  changePassword: '/profile/change-password',
} as const

export function createProfileRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  return [
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile', component: ProfilePage }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/profile/sessions',
      component: ActiveSessionsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/profile/change-password',
      component: ChangePasswordPage,
    }),
  ]
}
