import { createRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ProfilePage = lazyPage(() => import('./pages/ProfilePage'), 'ProfilePage')
const ActiveSessionsPage = lazyPage(() => import('./pages/ActiveSessionsPage'), 'ActiveSessionsPage')
const ChangePasswordPage = lazyPage(() => import('./pages/ChangePasswordPage'), 'ChangePasswordPage')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createProfileRoutes(appLayoutRoute: any) {
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
