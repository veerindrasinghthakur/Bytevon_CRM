/**
 * Dashboard module routes — spread into app router.
 * Paths: /dashboard (executive), /dashboard/employee, /dashboard/payroll
 */
import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { requireView } from '@/shared/rbac/require-permission'

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
      // Variable grant: any employment VIEW opens the page; the backend
      // scope-filters every number server-side (SELF sees self, ORG sees org).
      beforeLoad: requireView('employment'),
      component: ExecutiveDashboardPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: dashboardRoutes.employee,
      // Self-service view — any authenticated employment
      beforeLoad: requireView('employment'),
      component: EmployeeDashboardPage,
    }),
  ]
}
