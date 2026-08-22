import { createRoute } from '@tanstack/react-router'
import { PayrollDashboardPage } from './pages/PayrollDashboardPage'
import { MonthlyPayrollPage } from './pages/MonthlyPayrollPage'
import { RunPayrollPage } from './pages/RunPayrollPage'
import { GeneratingPayrollPage } from './pages/GeneratingPayrollPage'
import { PayrollReviewPage } from './pages/PayrollReviewPage'
import { PayslipViewPage } from './pages/PayslipViewPage'
import { SalaryManagementPage } from './pages/SalaryManagementPage'
import { EmployeeSalaryDetailPage } from './pages/EmployeeSalaryDetailPage'
import { ReviseSalaryPage } from './pages/ReviseSalaryPage'
import { EmployeePayrollHistoryPage } from './pages/EmployeePayrollHistoryPage'
import { PayrollHistoryPage } from './pages/PayrollHistoryPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPayrollRoutes(appLayoutRoute: any) {
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
