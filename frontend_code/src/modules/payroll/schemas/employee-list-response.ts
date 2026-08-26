import { z } from 'zod'
import { monthlyPayrollSummarySchema, payrollEmployeeRowSchema } from './payroll'

/** Paginated payroll employee list (+ optional metrics on full filtered set). */
export const payrollEmployeeListResponseSchema = z.object({
  items: z.array(payrollEmployeeRowSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  metrics: monthlyPayrollSummarySchema.optional(),
})
export type PayrollEmployeeListResponse = z.infer<typeof payrollEmployeeListResponseSchema>
