import type {
  PayrollEmployeeRow,
  PayrollActivity,
  PayrollKpis,
  PayrollPeriodMeta,
  MonthlyPayrollSummary,
} from '../types'

export type { PayrollStatus, PayrollEmployeeRow, PayrollActivity } from '../types'

export const payrollKpis: PayrollKpis = {
  totalPayroll: 482500,
  totalEmployees: 186,
  pendingApproval: 44,
  pendingPayment: 142,
  trendPct: 3.2,
}

export const periodMeta: PayrollPeriodMeta = {
  month: 'August',
  year: 2026,
  label: 'August 2026 Payroll',
  status: 'In Progress',
  calculated: 186,
  approved: 142,
  paid: 0,
}

export const payrollEmployees: PayrollEmployeeRow[] = [
  {
    id: 'e1',
    name: 'Sarah Jenkins',
    code: 'BT-092',
    role: 'Senior Engineer',
    department: 'Engineering',
    initials: 'SJ',
    gross: 8500,
    earnings: 1200,
    deductions: 950,
    net: 8750,
    status: 'Approved',
  },
  {
    id: 'e2',
    name: 'Michael Ross',
    code: 'BT-104',
    role: 'Sales Director',
    department: 'Sales',
    initials: 'MR',
    gross: 6200,
    earnings: 800,
    deductions: 700,
    net: 6300,
    status: 'Calculated',
  },
  {
    id: 'e3',
    name: 'Emily Chen',
    code: 'BT-085',
    role: 'HR Manager',
    department: 'HR',
    initials: 'EL',
    gross: 5800,
    earnings: 500,
    deductions: 600,
    net: 5700,
    status: 'Paid',
    paymentRef: 'TRX-998230',
  },
  {
    id: 'e4',
    name: 'Robert Chen',
    code: 'EMP-1042',
    role: 'Senior Engineer',
    department: 'Engineering',
    initials: 'RC',
    gross: 8500,
    earnings: 500,
    deductions: 1250,
    net: 7750,
    status: 'Calculated',
  },
  {
    id: 'e5',
    name: 'David Kim',
    code: 'EMP-0455',
    role: 'Financial Analyst',
    department: 'Finance',
    initials: 'DK',
    gross: 7500,
    earnings: 0,
    deductions: 1100,
    net: 6400,
    status: 'Paid',
    paymentRef: 'TRX-998232',
  },
]

export const recentActivity: PayrollActivity[] = [
  { id: 'a1', text: 'Payroll calculated for August 2026', time: '2h ago', primary: true },
  { id: 'a2', text: 'Tax filing configuration updated', time: '5h ago' },
  { id: 'a3', text: 'Salary structure adjusted for Engineering', time: 'Yesterday' },
]

export const monthlySummary: MonthlyPayrollSummary = {
  totalEmployees: 1248,
  grossSalary: '4.2M',
  earnings: 125000,
  deductions: 310000,
  netPayroll: '4.01M',
  pendingApproval: 42,
  pendingPayment: 12,
}

export function formatMoney(n: number, currency = '$') {
  return `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatMoneyShort(n: number, currency = '$') {
  if (n >= 1_000_000) return `${currency}${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(0)}K`
  return formatMoney(n, currency)
}
