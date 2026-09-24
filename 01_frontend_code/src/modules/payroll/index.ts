export { PayrollDashboardPage } from './pages/dashboard/PayrollDashboardPage'
export { MonthlyPayrollPage } from './pages/monthly/MonthlyPayrollPage'
export { RunPayrollPage } from './pages/run/RunPayrollPage'
export { GeneratingPayrollPage } from './pages/run/GeneratingPayrollPage'
export { PayrollReviewPage } from './pages/review/PayrollReviewPage'
export { PayslipViewPage } from './pages/payslip/PayslipViewPage'
export { SalaryManagementPage } from './pages/salary/SalaryManagementPage'
export { EmployeeSalaryDetailPage } from './pages/salary/EmployeeSalaryDetailPage'
export { ReviseSalaryPage } from './pages/salary/ReviseSalaryPage'
export { AddSalaryPage } from './pages/salary/AddSalaryPage'
export { EmployeePayrollHistoryPage } from './pages/history/EmployeePayrollHistoryPage'
export { PayrollHistoryPage } from './pages/history/PayrollHistoryPage'

export { createPayrollRoutes, payrollRoutes } from './routes'

export {
  listPayrollEmployees,
  getPayrollKpis,
  getPayrollPeriodMeta,
  getPayrollEmployee,
  getPayrollReview,
  getPayslip,
  getSalaryStructure,
  saveSalaryStructure,
  listUnconfiguredEmploymentIds,
  listSalaryVersions,
} from './api/payroll'

export {
  usePayrollDashboard,
  useMonthlyPayroll,
  usePayrollReview,
  usePayslip,
  useSalaryList,
  useSalaryDetail,
  useReviseSalary,
  useAddSalary,
  useEmployeePayrollHistory,
  useRunPayroll,
} from './hooks'

export type * from './types'
