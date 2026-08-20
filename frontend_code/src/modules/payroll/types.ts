/** Payroll domain types */

export type PayrollStatus = 'Calculated' | 'Approved' | 'Paid' | 'Pending'

export interface PayrollEmployeeRow {
  id: string
  name: string
  code: string
  role: string
  department: string
  initials: string
  avatar?: string
  gross: number
  earnings: number
  deductions: number
  net: number
  status: PayrollStatus
  paymentRef?: string
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
  label: string
  status: 'In Progress' | 'Completed' | 'Draft'
  calculated: number
  approved: number
  paid: number
}

export interface MonthlyPayrollSummary {
  totalEmployees: number
  grossSalary: string
  earnings: number
  deductions: number
  netPayroll: string
  pendingApproval: number
  pendingPayment: number
}
