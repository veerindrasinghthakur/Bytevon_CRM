/**
 * Dashboard module routes — spread into app router.
 * Paths: /dashboard (executive), /dashboard/employee, /dashboard/payroll
 */
import { createRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ExecutiveDashboardPage = lazyPage(
  () => import('./pages/ExecutiveDashboardPage'),
  'ExecutiveDashboardPage',
)
const EmployeeDashboardPage = lazyPage(
  () => import('./pages/EmployeeDashboardPage'),
  'EmployeeDashboardPage',
)
const PayrollDashboardPage = lazyPage(
  () => import('./pages/PayrollDashboardPage'),
  'PayrollDashboardPage',
)

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const dashboardRoutes = {
  root: '/dashboard',
  executive: '/dashboard',
  employee: '/dashboard/employee',
  payroll: '/dashboard/payroll',
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDashboardRoutes(appLayoutRoute: any) {
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
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: dashboardRoutes.payroll,
      component: PayrollDashboardPage,
    }),
  ]
}
