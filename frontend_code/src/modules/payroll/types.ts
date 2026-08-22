/** Payroll domain types — DB-shaped or computed from mock/API */

export type PayrollStatus = 'Calculated' | 'Approved' | 'Paid' | 'Pending'

export interface PayrollEmployeeRow {
  id: string
  name: string
  code: string
  role: string
  department: string
  initials: string
  avatar?: string
  /** Base gross package (salary structure total earnings) */
  gross: number
  /** Variable / OT earnings for the period */
  earnings: number
  deductions: number
  net: number
  status: PayrollStatus
  paymentRef?: string
  currency?: string
  effectiveFrom?: string
  salaryStatus?: 'ACTIVE' | 'ARCHIVED'
}

export interface PayrollActivity {
  id: string
  text: string
  time: string
  primary?: boolean
}

export interface PayrollKpis {
  totalPayroll: number
  totalEmployees: number
  pendingApproval: number
  pendingPayment: number
  trendPct: number
}

export interface PayrollPeriodMeta {
  month: string
  year: number
  monthIndex: number
  label: string
  status: 'In Progress' | 'Completed' | 'Draft'
  calculated: number
  approved: number
  paid: number
}

export interface MonthlyPayrollSummary {
  totalEmployees: number
  grossSalary: number
  earnings: number
  deductions: number
  netPayroll: number
  pendingApproval: number
  pendingPayment: number
}

export type SalaryItemType = 'EARNING' | 'DEDUCTION'

export interface SalaryItem {
  id: string
  name: string
  type: SalaryItemType
  amount: number
}

/** Configured salary structure (versioned) */
export interface SalaryStructure {
  employeeId: string
  effectiveFrom: string
  effectiveTo: string | null
  currency: string
  payFrequency: 'Monthly' | 'Biweekly'
  items: SalaryItem[]
  status: 'ACTIVE' | 'ARCHIVED'
}

export interface AttendanceSummary {
  workingDays: number
  presentDays: number
  paidLeave: number
  lopDays: number
  workingHours: number
  overtimeHours: number
}

export interface PayrollAdjustment {
  id: string
  title: string
  detail: string
  amount: number
}

export interface LineItem {
  name: string
  amount: number
}

/** Fully computed payroll review for one employee + period */
export interface PayrollReviewDetail {
  employee: PayrollEmployeeRow
  periodLabel: string
  attendance: AttendanceSummary
  earnings: LineItem[]
  deductions: LineItem[]
  adjustments: PayrollAdjustment[]
  gross: number
  totalEarnings: number
  totalDeductions: number
  netAdjustments: number
  netPayable: number
}

export interface PayrollHistoryRow {
  id: string
  month: string
  year: number
  gross: number
  earnings: number
  deductions: number
  adjustments: number
  net: number
  paymentDate: string | null
  status: 'PAID' | 'APPROVED' | 'CALCULATED'
}

export interface PayslipDetail {
  employee: PayrollEmployeeRow
  periodLabel: string
  paymentDate: string
  paymentMethod: string
  referenceNumber: string
  earnings: LineItem[]
  deductions: LineItem[]
  adjustments: PayrollAdjustment[]
  gross: number
  totalEarnings: number
  totalDeductions: number
  netAdjustments: number
  net: number
}

export interface RunPayrollCheck {
  ok: boolean
  title: string
  detail: string
}
