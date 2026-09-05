/** Re-export domain types from Zod schemas — MODULE_STANDARDS. */

export type {
  PayrollStatus,
  PayrollEmployeeRow,
  PayrollActivity,
  PayrollKpis,
  PayrollPeriodMeta,
  MonthlyPayrollSummary,
  SalaryItemType,
  SalaryItem,
  SalaryStructure,
  AttendanceSummary,
  PayrollAdjustment,
  LineItem,
  PayrollReviewDetail,
  PayrollHistoryRow,
  PayslipDetail,
  RunPayrollCheck,
  SaveSalaryStructureInput,
} from './schemas/payroll'

export {
  payrollStatusSchema,
  payrollEmployeeRowSchema,
  salaryItemSchema,
  salaryStructureSchema,
  saveSalaryStructureInputSchema,
} from './schemas/payroll'

export type { PayrollEmployeeListResponse } from './schemas/employee-list-response'
export { payrollEmployeeListResponseSchema } from './schemas/employee-list-response'

export type { SalaryFormInput, SalaryItemFormInput } from './schemas/salary-form'
export {
  salaryFormSchema,
  emptySalaryItemForm,
  salaryItemsToForm,
  toSaveSalaryInput,
} from './schemas/salary-form'

export {
  payrollStatusStyles,
  payrollHistoryStatusStyles,
  SALARY_ITEM_TYPE_OPTIONS,
  PAYROLL_STATUS_OPTIONS,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  DEMO_VIEW_OPTIONS,
} from './schemas/enums'

/** Demo view modes for payroll (MonthlyPayrollPage). */
export type PayrollRunView = 'ready' | 'empty' | 'error' | 'locked'

export interface PayrollEmployeeListParams {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

/** Org-wide paid history row (history list page). */
export interface OrgPayrollHistoryRecord {
  id: string
  period: string
  employeeId: string
  paidOn: string
  gross: number
  net: number
  ref: string
}
import type{PayrollEmployeeRow} from './schemas/payroll'
export interface RunPayrollPreview {
  employees: PayrollEmployeeRow[]
  totalGross: number
  totalEarnings: number
  totalDeductions: number
  estimatedNet: number
}
