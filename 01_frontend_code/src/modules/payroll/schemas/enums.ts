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

/** Payment method options for the pay form (backend accepts free string ≤50; extend here). */
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
] as const

/** Payroll status filter options (MonthlyPayrollPage). */
export const PAYROLL_STATUS_OPTIONS = [
  { value: 'All', label: 'Status: All' },
  { value: 'Calculated', label: 'Calculated' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Paid', label: 'Paid' },
]

/** Month selector options (MonthlyPayrollPage). */
export const MONTH_OPTIONS = [
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
]

/** Year selector options (MonthlyPayrollPage). */
export const YEAR_OPTIONS = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
]

/** Demo view state options (MonthlyPayrollPage). */
export const DEMO_VIEW_OPTIONS = [
  { value: 'ready', label: 'Ready' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
  { value: 'locked', label: 'Paid / locked' },
]
