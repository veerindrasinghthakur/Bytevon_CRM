import { z } from 'zod'

export const payrollStatusSchema = z.enum(['Calculated', 'Approved', 'Paid', 'Pending'])
export type PayrollStatus = z.infer<typeof payrollStatusSchema>

export const payrollEmployeeRowSchema = z.object({
  id: z.string(),
  /** MonthlyPayroll.id — present in real-API rows, used for review/payslip routes. */
  payrollId: z.string().optional(),
  /** Employment id — used for salary/history routes. */
  employmentId: z.string().optional(),
  name: z.string(),
  code: z.string(),
  role: z.string(),
  department: z.string(),
  initials: z.string(),
  avatar: z.string().optional(),
  gross: z.number(),
  earnings: z.number(),
  deductions: z.number(),
  net: z.number(),
  status: payrollStatusSchema,
  paymentRef: z.string().optional(),
  currency: z.string().optional(),
  effectiveFrom: z.string().optional(),
  salaryStatus: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
})
export type PayrollEmployeeRow = z.infer<typeof payrollEmployeeRowSchema>

export const payrollActivitySchema = z.object({
  id: z.string(),
  text: z.string(),
  time: z.string(),
  primary: z.boolean().optional(),
})
export type PayrollActivity = z.infer<typeof payrollActivitySchema>

export const payrollKpisSchema = z.object({
  totalPayroll: z.number(),
  totalEmployees: z.number(),
  pendingApproval: z.number(),
  pendingPayment: z.number(),
  trendPct: z.number(),
})
export type PayrollKpis = z.infer<typeof payrollKpisSchema>

export const payrollPeriodMetaSchema = z.object({
  month: z.string(),
  year: z.number(),
  monthIndex: z.number(),
  label: z.string(),
  status: z.enum(['In Progress', 'Completed', 'Draft']),
  calculated: z.number(),
  approved: z.number(),
  paid: z.number(),
})
export type PayrollPeriodMeta = z.infer<typeof payrollPeriodMetaSchema>

export const monthlyPayrollSummarySchema = z.object({
  totalEmployees: z.number(),
  grossSalary: z.number(),
  earnings: z.number(),
  deductions: z.number(),
  netPayroll: z.number(),
  pendingApproval: z.number(),
  pendingPayment: z.number(),
})
export type MonthlyPayrollSummary = z.infer<typeof monthlyPayrollSummarySchema>

export const salaryItemTypeSchema = z.enum(['EARNING', 'DEDUCTION'])
export type SalaryItemType = z.infer<typeof salaryItemTypeSchema>

export const salaryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: salaryItemTypeSchema,
  amount: z.number(),
})
export type SalaryItem = z.infer<typeof salaryItemSchema>

export const salaryStructureSchema = z.object({
  employeeId: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  currency: z.string(),
  payFrequency: z.enum(['Monthly', 'Biweekly']),
  items: z.array(salaryItemSchema),
  status: z.enum(['ACTIVE', 'ARCHIVED']),
})
export type SalaryStructure = z.infer<typeof salaryStructureSchema>

export const attendanceSummarySchema = z.object({
  workingDays: z.number(),
  presentDays: z.number(),
  paidLeave: z.number(),
  lopDays: z.number(),
  workingHours: z.number(),
  overtimeHours: z.number(),
})
export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>

export const payrollAdjustmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  amount: z.number(),
})
export type PayrollAdjustment = z.infer<typeof payrollAdjustmentSchema>

export const lineItemSchema = z.object({
  name: z.string(),
  amount: z.number(),
})
export type LineItem = z.infer<typeof lineItemSchema>

export const payrollReviewDetailSchema = z.object({
  employee: payrollEmployeeRowSchema,
  periodLabel: z.string(),
  attendance: attendanceSummarySchema,
  earnings: z.array(lineItemSchema),
  deductions: z.array(lineItemSchema),
  adjustments: z.array(payrollAdjustmentSchema),
  gross: z.number(),
  totalEarnings: z.number(),
  totalDeductions: z.number(),
  netAdjustments: z.number(),
  netPayable: z.number(),
})
export type PayrollReviewDetail = z.infer<typeof payrollReviewDetailSchema>

export const payrollHistoryRowSchema = z.object({
  id: z.string(),
  /** MonthlyPayroll.id — payslip links use this, not the employment id. */
  payrollId: z.string().optional(),
  month: z.string(),
  year: z.number(),
  gross: z.number(),
  earnings: z.number(),
  deductions: z.number(),
  adjustments: z.number(),
  net: z.number(),
  paymentDate: z.string().nullable(),
  status: z.enum(['PAID', 'APPROVED', 'CALCULATED']),
})
export type PayrollHistoryRow = z.infer<typeof payrollHistoryRowSchema>

export const payslipDetailSchema = z.object({
  employee: payrollEmployeeRowSchema,
  periodLabel: z.string(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  referenceNumber: z.string(),
  earnings: z.array(lineItemSchema),
  deductions: z.array(lineItemSchema),
  adjustments: z.array(payrollAdjustmentSchema),
  gross: z.number(),
  totalEarnings: z.number(),
  totalDeductions: z.number(),
  netAdjustments: z.number(),
  net: z.number(),
})
export type PayslipDetail = z.infer<typeof payslipDetailSchema>

export const runPayrollCheckSchema = z.object({
  ok: z.boolean(),
  title: z.string(),
  detail: z.string(),
})
export type RunPayrollCheck = z.infer<typeof runPayrollCheckSchema>

export const saveSalaryStructureInputSchema = z.object({
  effectiveFrom: z.string().min(1),
  items: z.array(salaryItemSchema),
})
export type SaveSalaryStructureInput = z.infer<typeof saveSalaryStructureInputSchema>
