/** Payroll API barrel — domain modules are the source of truth. */
export {
  getPayrollKpis,
  getPayrollPeriodMeta,
  listPayrollActivity,
} from './dashboard'
export {
  listPayrollEmployees,
  getPayrollEmployee,
  getMonthlyPayrollSummary,
} from './monthly'
export {
  getRunPayrollChecks,
  getRunPayrollPreview,
  runPayroll,
} from './run'
export {
  getPayrollReview,
  approvePayrollEmployee,
  payPayrollEmployee,
  rejectPayroll,
} from './review'
export { getPayslip } from './payslip'
export { getSalaryStructure, saveSalaryStructure } from './salary'
export {
  listEmployeePayrollHistory,
  listOrgPayrollHistory,
} from './history'
