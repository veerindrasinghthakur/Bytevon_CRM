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
} from './schemas/enums'
