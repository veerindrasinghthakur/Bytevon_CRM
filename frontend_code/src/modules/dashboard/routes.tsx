/**
 * Dashboard module routes — spread into app router.
 * Path: /dashboard (executive)
 */
import { createRoute } from '@tanstack/react-router'
import { ExecutiveDashboardPage } from './pages/ExecutiveDashboardPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDashboardRoutes(appLayoutRoute: any) {
  const dashboardRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/dashboard',
    component: ExecutiveDashboardPage,
  })
  return [dashboardRoute]
}
