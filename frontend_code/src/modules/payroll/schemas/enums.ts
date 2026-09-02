/** Payroll status / badge style maps — semantic tokens only. */

import type { PayrollStatus } from './payroll'

/** Monthly / dashboard payroll status pills */
export const payrollStatusStyles: Record<PayrollStatus | string, string> = {
  Approved: 'status-badge status-warning',
  Calculated: 'status-badge status-neutral',
  Paid: 'status-badge status-success',
  Pending: 'status-badge status-info',
}

/** Employee history status (uppercase API values) */
export const payrollHistoryStatusStyles: Record<string, string> = {
  PAID: 'status-badge status-success',
  APPROVED: 'status-badge status-info',
  CALCULATED: 'status-badge status-neutral',
}

export const SALARY_ITEM_TYPE_OPTIONS = [
  { value: 'EARNING', label: 'EARNING' },
  { value: 'DEDUCTION', label: 'DEDUCTION' },
] as const
