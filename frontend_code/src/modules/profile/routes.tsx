import { createRoute } from '@tanstack/react-router'
import { ProfilePage } from './pages/ProfilePage'
import { ActiveSessionsPage } from './pages/ActiveSessionsPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createProfileRoutes(appLayoutRoute: any) {
  return [
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile', component: ProfilePage }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/profile/sessions',
      component: ActiveSessionsPage,
    }),
  ]
}
