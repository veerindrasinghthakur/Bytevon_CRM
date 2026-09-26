import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { requirePermission, requireView } from '@/shared/rbac/require-permission'

/** Variable grants: any VIEW opens a page; CREATE/UPDATE gates actions. Data is scope-filtered server-side. */
/** Finance mutators additionally floor at ORGANIZATION scope (sensitive-data tier). */
const requirePayrollView = () => requireView('payroll')
const requireSalaryView = () => requireView('salary')
const requirePayrollCreate = () =>
  requirePermission({ action: 'CREATE', resource: 'payroll', minScope: 'ORGANIZATION' })
const requireSalaryUpdate = () =>
  requirePermission({ action: 'UPDATE', resource: 'salary', minScope: 'ORGANIZATION' })
const requireSalaryCreate = () =>
  requirePermission({ action: 'CREATE', resource: 'salary', minScope: 'ORGANIZATION' })

const PayrollDashboardPage = lazyPage(
  () => import('./pages/dashboard/PayrollDashboardPage'),
  'PayrollDashboardPage',
)
const MonthlyPayrollPage = lazyPage(
  () => import('./pages/monthly/MonthlyPayrollPage'),
  'MonthlyPayrollPage',
)
const MonthlyPayrollDetailPage = lazyPage(
  () => import('./pages/monthly/MonthlyPayrollDetailPage'),
  'MonthlyPayrollDetailPage',
)
const RunPayrollPage = lazyPage(() => import('./pages/run/RunPayrollPage'), 'RunPayrollPage')
const GeneratingPayrollPage = lazyPage(
  () => import('./pages/run/GeneratingPayrollPage'),
  'GeneratingPayrollPage',
)
const PayrollReviewPage = lazyPage(
  () => import('./pages/review/PayrollReviewPage'),
  'PayrollReviewPage',
)
const PayslipViewPage = lazyPage(() => import('./pages/payslip/PayslipViewPage'), 'PayslipViewPage')
const SalaryManagementPage = lazyPage(
  () => import('./pages/salary/SalaryManagementPage'),
  'SalaryManagementPage',
)
const EmployeeSalaryDetailPage = lazyPage(
  () => import('./pages/salary/EmployeeSalaryDetailPage'),
  'EmployeeSalaryDetailPage',
)
const AddSalaryPage = lazyPage(
  () => import('./pages/salary/AddSalaryPage'),
  'AddSalaryPage',
)
const ReviseSalaryPage = lazyPage(
  () => import('./pages/salary/ReviseSalaryPage'),
  'ReviseSalaryPage',
)
const EmployeePayrollHistoryPage = lazyPage(
  () => import('./pages/history/EmployeePayrollHistoryPage'),
  'EmployeePayrollHistoryPage',
)
const PayrollHistoryPage = lazyPage(
  () => import('./pages/history/PayrollHistoryPage'),
  'PayrollHistoryPage',
)

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const payrollRoutes = {
  root: '/payroll',
  monthly: '/payroll/monthly',
  monthlyDetail: (payrollId: string) => `/payroll/monthly/${payrollId}`,
  monthlyDetailPath: '/payroll/monthly/$payrollId',
  run: '/payroll/run',
  generating: '/payroll/generating',
  review: (payrollId: string) => `/payroll/review/${payrollId}`,
  reviewPath: '/payroll/review/$payrollId',
  payslip: (payrollId: string) => `/payroll/payslip/${payrollId}`,
  payslipPath: '/payroll/payslip/$payrollId',
  salary: '/payroll/salary',
  salaryNew: '/payroll/salary/new',
  salaryNewPath: '/payroll/salary/new',
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
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll',
      beforeLoad: requirePayrollView,
      component: PayrollDashboardPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/monthly',
      beforeLoad: requirePayrollView,
      component: MonthlyPayrollPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/monthly/$payrollId',
      beforeLoad: requirePayrollView,
      component: MonthlyPayrollDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/run',
      beforeLoad: requirePayrollCreate,
      component: RunPayrollPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/generating',
      beforeLoad: requirePayrollCreate,
      component: GeneratingPayrollPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/review/$payrollId',
      beforeLoad: requirePayrollView,
      component: PayrollReviewPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/payslip/$payrollId',
      // Payslip detail is owner-or-grant on the backend — action gate only here
      beforeLoad: requirePayrollView,
      component: PayslipViewPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/salary',
      beforeLoad: requireSalaryView,
      component: SalaryManagementPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/salary/new',
      beforeLoad: requireSalaryCreate,
      component: AddSalaryPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/salary/$employeeId',
      beforeLoad: requireSalaryView,
      component: EmployeeSalaryDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/salary/$employeeId/revise',
      beforeLoad: requireSalaryUpdate,
      component: ReviseSalaryPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/history',
      beforeLoad: requirePayrollView,
      component: PayrollHistoryPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/payroll/history/$employeeId',
      beforeLoad: requirePayrollView,
      component: EmployeePayrollHistoryPage,
    }),
  ]
}
