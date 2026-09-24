import { describe, expect, it } from 'vitest'
import { payrollStatusSchema, salaryItemTypeSchema } from '@/modules/payroll/schemas/payroll'
import { salaryFormSchema } from '@/modules/payroll/schemas/salary-form'

describe('payroll schemas', () => {
  it('accepts known payroll statuses and item types', () => {
    for (const s of ['Calculated', 'Approved', 'Paid', 'Pending']) {
      expect(payrollStatusSchema.safeParse(s).success).toBe(true)
    }
    expect(salaryItemTypeSchema.safeParse('EARNING').success).toBe(true)
    expect(salaryItemTypeSchema.safeParse('DEDUCTION').success).toBe(true)
    expect(salaryItemTypeSchema.safeParse('BONUS').success).toBe(false)
  })
  it('rejects empty salary forms', () => {
    expect(salaryFormSchema.safeParse({}).success).toBe(false)
  })
})
