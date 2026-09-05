/**
 * Dashboard module routes — spread into app router.
 * Paths: /dashboard (executive), /dashboard/employee, /dashboard/payroll
 */
import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ExecutiveDashboardPage = lazyPage(
  () => import('./pages/ExecutiveDashboardPage'),
  'ExecutiveDashboardPage',
)
const EmployeeDashboardPage = lazyPage(
  () => import('./pages/EmployeeDashboardPage'),
  'EmployeeDashboardPage',
)

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const dashboardRoutes = {
  root: '/dashboard',
  executive: '/dashboard',
  employee: '/dashboard/employee',
} as const

export function createDashboardRoutes(appLayoutRoute: AnyRoute) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: dashboardRoutes.executive,
      component: ExecutiveDashboardPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: dashboardRoutes.employee,
      component: EmployeeDashboardPage,
    }),
  ]
}
