import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const PayrollDashboardPage = lazyPage(() => import('./pages/PayrollDashboardPage'), 'PayrollDashboardPage')
const MonthlyPayrollPage = lazyPage(() => import('./pages/MonthlyPayrollPage'), 'MonthlyPayrollPage')
const RunPayrollPage = lazyPage(() => import('./pages/RunPayrollPage'), 'RunPayrollPage')
const GeneratingPayrollPage = lazyPage(
  () => import('./pages/GeneratingPayrollPage'),
  'GeneratingPayrollPage',
)
const PayrollReviewPage = lazyPage(() => import('./pages/PayrollReviewPage'), 'PayrollReviewPage')
const PayslipViewPage = lazyPage(() => import('./pages/PayslipViewPage'), 'PayslipViewPage')
const SalaryManagementPage = lazyPage(
  () => import('./pages/SalaryManagementPage'),
  'SalaryManagementPage',
)
const EmployeeSalaryDetailPage = lazyPage(
  () => import('./pages/EmployeeSalaryDetailPage'),
  'EmployeeSalaryDetailPage',
)
const ReviseSalaryPage = lazyPage(() => import('./pages/ReviseSalaryPage'), 'ReviseSalaryPage')
const EmployeePayrollHistoryPage = lazyPage(
  () => import('./pages/EmployeePayrollHistoryPage'),
  'EmployeePayrollHistoryPage',
)
const PayrollHistoryPage = lazyPage(() => import('./pages/PayrollHistoryPage'), 'PayrollHistoryPage')

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const payrollRoutes = {
  root: '/payroll',
  monthly: '/payroll/monthly',
  run: '/payroll/run',
  generating: '/payroll/generating',
  review: (employeeId: string) => `/payroll/review/${employeeId}`,
  reviewPath: '/payroll/review/$employeeId',
  payslip: (employeeId: string) => `/payroll/payslip/${employeeId}`,
  payslipPath: '/payroll/payslip/$employeeId',
  salary: '/payroll/salary',
  salaryDetail: (employeeId: string) => `/payroll/salary/${employeeId}`,
  salaryDetailPath: '/payroll/salary/$employeeId',
  salaryRevise: (employeeId: string) => `/payroll/salary/${employeeId}/revise`,
  salaryRevisePath: '/payroll/salary/$employeeId/revise',
  history: '/payroll/history',
  historyEmployee: (employeeId: string) => `/payroll/history/${employeeId}`,
  historyEmployeePath: '/payroll/history/$employeeId',
} as const

export function createPayrollRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  return [
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/payroll', component: PayrollDashboardPage }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/monthly',
      component: MonthlyPayrollPage,
    }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/payroll/run', component: RunPayrollPage }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/generating',
      component: GeneratingPayrollPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/review/$employeeId',
      component: PayrollReviewPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/payslip/$employeeId',
      component: PayslipViewPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/salary',
      component: SalaryManagementPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/salary/$employeeId',
      component: EmployeeSalaryDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/salary/$employeeId/revise',
      component: ReviseSalaryPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/history',
      component: PayrollHistoryPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/history/$employeeId',
      component: EmployeePayrollHistoryPage,
    }),
  ]
}
