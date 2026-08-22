/**
 * Payroll mock seed + pure compute helpers.
 * Pages/hooks must not hardcode display numbers — use API which reads this seed.
 */
import type {
  AttendanceSummary,
  LineItem,
  MonthlyPayrollSummary,
  PayrollActivity,
  PayrollAdjustment,
  PayrollEmployeeRow,
  PayrollHistoryRow,
  PayrollKpis,
  PayrollPeriodMeta,
  PayrollReviewDetail,
  PayslipDetail,
  RunPayrollCheck,
  SalaryStructure,
} from '../types'

export const periodMeta: PayrollPeriodMeta = {
  month: 'August',
  year: 2026,
  monthIndex: 8,
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
    currency: 'USD',
    effectiveFrom: '2024-01-01',
    salaryStatus: 'ACTIVE',
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
    currency: 'USD',
    effectiveFrom: '2024-03-01',
    salaryStatus: 'ACTIVE',
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
    currency: 'USD',
    effectiveFrom: '2023-06-01',
    salaryStatus: 'ACTIVE',
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
    currency: 'USD',
    effectiveFrom: '2024-01-01',
    salaryStatus: 'ACTIVE',
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
    currency: 'USD',
    effectiveFrom: '2024-02-15',
    salaryStatus: 'ACTIVE',
  },
]

export const salaryStructures: Record<string, SalaryStructure> = {
  e1: {
    employeeId: 'e1',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    currency: 'USD',
    payFrequency: 'Monthly',
    status: 'ACTIVE',
    items: [
      { id: 'e1-1', name: 'Basic Salary', type: 'EARNING', amount: 5000 },
      { id: 'e1-2', name: 'House Rent Allowance (HRA)', type: 'EARNING', amount: 2000 },
      { id: 'e1-3', name: 'Conveyance Allowance', type: 'EARNING', amount: 800 },
      { id: 'e1-4', name: 'Special Allowance', type: 'EARNING', amount: 700 },
      { id: 'e1-5', name: 'Provident Fund (PF)', type: 'DEDUCTION', amount: 450 },
      { id: 'e1-6', name: 'Professional Tax', type: 'DEDUCTION', amount: 45 },
    ],
  },
  e2: {
    employeeId: 'e2',
    effectiveFrom: '2024-03-01',
    effectiveTo: null,
    currency: 'USD',
    payFrequency: 'Monthly',
    status: 'ACTIVE',
    items: [
      { id: 'e2-1', name: 'Basic Salary', type: 'EARNING', amount: 4000 },
      { id: 'e2-2', name: 'House Rent Allowance (HRA)', type: 'EARNING', amount: 1500 },
      { id: 'e2-3', name: 'Conveyance Allowance', type: 'EARNING', amount: 400 },
      { id: 'e2-4', name: 'Special Allowance', type: 'EARNING', amount: 300 },
      { id: 'e2-5', name: 'Provident Fund (PF)', type: 'DEDUCTION', amount: 360 },
      { id: 'e2-6', name: 'Professional Tax', type: 'DEDUCTION', amount: 45 },
    ],
  },
  e3: {
    employeeId: 'e3',
    effectiveFrom: '2023-06-01',
    effectiveTo: null,
    currency: 'USD',
    payFrequency: 'Monthly',
    status: 'ACTIVE',
    items: [
      { id: 'e3-1', name: 'Basic Salary', type: 'EARNING', amount: 3500 },
      { id: 'e3-2', name: 'House Rent Allowance (HRA)', type: 'EARNING', amount: 1400 },
      { id: 'e3-3', name: 'Conveyance Allowance', type: 'EARNING', amount: 400 },
      { id: 'e3-4', name: 'Special Allowance', type: 'EARNING', amount: 500 },
      { id: 'e3-5', name: 'Provident Fund (PF)', type: 'DEDUCTION', amount: 315 },
      { id: 'e3-6', name: 'Professional Tax', type: 'DEDUCTION', amount: 45 },
    ],
  },
  e4: {
    employeeId: 'e4',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    currency: 'USD',
    payFrequency: 'Monthly',
    status: 'ACTIVE',
    items: [
      { id: 'e4-1', name: 'Basic Salary', type: 'EARNING', amount: 5000 },
      { id: 'e4-2', name: 'House Rent Allowance (HRA)', type: 'EARNING', amount: 2000 },
      { id: 'e4-3', name: 'Conveyance Allowance', type: 'EARNING', amount: 800 },
      { id: 'e4-4', name: 'Special Allowance', type: 'EARNING', amount: 700 },
      { id: 'e4-5', name: 'Provident Fund (PF)', type: 'DEDUCTION', amount: 450 },
      { id: 'e4-6', name: 'Professional Tax', type: 'DEDUCTION', amount: 45 },
    ],
  },
  e5: {
    employeeId: 'e5',
    effectiveFrom: '2024-02-15',
    effectiveTo: null,
    currency: 'USD',
    payFrequency: 'Monthly',
    status: 'ACTIVE',
    items: [
      { id: 'e5-1', name: 'Basic Salary', type: 'EARNING', amount: 4500 },
      { id: 'e5-2', name: 'House Rent Allowance (HRA)', type: 'EARNING', amount: 1800 },
      { id: 'e5-3', name: 'Conveyance Allowance', type: 'EARNING', amount: 600 },
      { id: 'e5-4', name: 'Special Allowance', type: 'EARNING', amount: 600 },
      { id: 'e5-5', name: 'Provident Fund (PF)', type: 'DEDUCTION', amount: 405 },
      { id: 'e5-6', name: 'Professional Tax', type: 'DEDUCTION', amount: 45 },
    ],
  },
}

export const attendanceByEmployee: Record<string, AttendanceSummary> = {
  e1: { workingDays: 22, presentDays: 20, paidLeave: 2, lopDays: 0, workingHours: 176, overtimeHours: 12 },
  e2: { workingDays: 22, presentDays: 21, paidLeave: 1, lopDays: 0, workingHours: 168, overtimeHours: 8 },
  e3: { workingDays: 22, presentDays: 22, paidLeave: 0, lopDays: 0, workingHours: 176, overtimeHours: 4 },
  e4: { workingDays: 22, presentDays: 19, paidLeave: 2, lopDays: 1, workingHours: 152, overtimeHours: 6 },
  e5: { workingDays: 22, presentDays: 20, paidLeave: 2, lopDays: 0, workingHours: 160, overtimeHours: 0 },
}

export const adjustmentsByEmployee: Record<string, PayrollAdjustment[]> = {
  e1: [
    { id: 'adj1', title: 'August Attendance Correction', detail: 'Manual override for missing punch', amount: 150 },
    { id: 'adj2', title: 'Hardware Deduction', detail: 'Lost access badge replacement', amount: -25 },
  ],
  e2: [{ id: 'adj3', title: 'Sales incentive', detail: 'Q3 target partial', amount: 200 }],
  e3: [],
  e4: [{ id: 'adj4', title: 'LOP recovery note', detail: 'One LOP day applied', amount: -100 }],
  e5: [],
}

const OT_HOURLY_FACTOR = 1.5
const STANDARD_MONTH_HOURS = 176

export function structureGross(s: SalaryStructure): number {
  return s.items.filter((i) => i.type === 'EARNING').reduce((sum, i) => sum + i.amount, 0)
}

export function structureDeductions(s: SalaryStructure): number {
  return s.items.filter((i) => i.type === 'DEDUCTION').reduce((sum, i) => sum + i.amount, 0)
}

export function computeOvertimePay(gross: number, overtimeHours: number): number {
  if (overtimeHours <= 0) return 0
  const hourly = gross / STANDARD_MONTH_HOURS
  return Math.round(hourly * OT_HOURLY_FACTOR * overtimeHours)
}

export function computeTds(taxable: number): number {
  if (taxable <= 0) return 0
  return Math.round(taxable * 0.1)
}

export function computeReview(employeeId: string): PayrollReviewDetail | null {
  const employee = payrollEmployees.find((e) => e.id === employeeId)
  if (!employee) return null
  const structure = salaryStructures[employeeId]
  const attendance = attendanceByEmployee[employeeId] ?? {
    workingDays: 22,
    presentDays: 22,
    paidLeave: 0,
    lopDays: 0,
    workingHours: 176,
    overtimeHours: 0,
  }
  const adjustments = adjustmentsByEmployee[employeeId] ?? []

  const baseEarnings: LineItem[] = structure
    ? structure.items.filter((i) => i.type === 'EARNING').map((i) => ({ name: i.name, amount: i.amount }))
    : [{ name: 'Basic Salary', amount: employee.gross }]

  const gross = baseEarnings.reduce((s, i) => s + i.amount, 0)
  const otPay = computeOvertimePay(gross, attendance.overtimeHours)
  const earnings: LineItem[] =
    otPay > 0 ? [...baseEarnings, { name: 'Overtime Pay', amount: otPay }] : baseEarnings
  const totalEarnings = earnings.reduce((s, i) => s + i.amount, 0)

  const fixedDed: LineItem[] = structure
    ? structure.items.filter((i) => i.type === 'DEDUCTION').map((i) => ({ name: i.name, amount: i.amount }))
    : []
  const tds = computeTds(totalEarnings - fixedDed.reduce((s, i) => s + i.amount, 0))
  const deductions: LineItem[] = [...fixedDed]
  if (tds > 0) deductions.push({ name: 'Tax Deducted at Source (TDS)', amount: tds })
  const totalDeductions = deductions.reduce((s, i) => s + i.amount, 0)

  const netAdjustments = adjustments.reduce((s, a) => s + a.amount, 0)
  const netPayable = totalEarnings - totalDeductions + netAdjustments

  return {
    employee: {
      ...employee,
      gross,
      earnings: otPay,
      deductions: totalDeductions,
      net: netPayable,
    },
    periodLabel: periodMeta.label,
    attendance,
    earnings,
    deductions,
    adjustments,
    gross,
    totalEarnings,
    totalDeductions,
    netAdjustments,
    netPayable,
  }
}

export function computePayslip(employeeId: string): PayslipDetail | null {
  const review = computeReview(employeeId)
  if (!review) return null
  const emp = review.employee
  return {
    employee: emp,
    periodLabel: review.periodLabel,
    paymentDate: emp.status === 'Paid' ? '2026-08-31' : '—',
    paymentMethod: 'Bank Transfer',
    referenceNumber: emp.paymentRef ?? '—',
    earnings: review.earnings,
    deductions: review.deductions,
    adjustments: review.adjustments,
    gross: review.gross,
    totalEarnings: review.totalEarnings,
    totalDeductions: review.totalDeductions,
    netAdjustments: review.netAdjustments,
    net: review.netPayable,
  }
}

export const historyByEmployee: Record<string, PayrollHistoryRow[]> = {
  e1: [
    { id: 'h1', month: 'July 2026', year: 2026, gross: 8500, earnings: 900, deductions: 950, adjustments: 0, net: 8450, paymentDate: '2026-07-31', status: 'PAID' },
    { id: 'h2', month: 'June 2026', year: 2026, gross: 8500, earnings: 500, deductions: 950, adjustments: 0, net: 8050, paymentDate: '2026-06-30', status: 'PAID' },
    { id: 'h3', month: 'May 2026', year: 2026, gross: 8500, earnings: 500, deductions: 950, adjustments: -100, net: 7950, paymentDate: '2026-05-31', status: 'PAID' },
  ],
  e4: [
    { id: 'h4', month: 'July 2026', year: 2026, gross: 8500, earnings: 400, deductions: 1250, adjustments: 0, net: 7650, paymentDate: '2026-07-31', status: 'PAID' },
  ],
}

export const recentActivity: PayrollActivity[] = [
  { id: 'a1', text: 'Payroll calculated for August 2026', time: '2h ago', primary: true },
  { id: 'a2', text: 'Tax filing configuration updated', time: '5h ago' },
  { id: 'a3', text: 'Salary structure adjusted for Engineering', time: 'Yesterday' },
]

export const runPayrollChecks: RunPayrollCheck[] = [
  { ok: true, title: 'Employee salary configuration available', detail: 'All active employees have a base salary set.' },
  { ok: true, title: 'Monthly attendance summary available', detail: 'Timesheets are available for processing.' },
  { ok: true, title: 'No existing payroll for this month', detail: 'Selected period is clear to generate.' },
  { ok: true, title: 'Period ready', detail: 'You can generate payroll for the selected month.' },
]

export function computeKpis(): PayrollKpis {
  const employees = payrollEmployees
  const totalPayroll = employees.reduce((s, e) => s + e.net, 0)
  return {
    totalPayroll,
    totalEmployees: employees.length,
    pendingApproval: employees.filter((e) => e.status === 'Calculated').length,
    pendingPayment: employees.filter((e) => e.status === 'Approved').length,
    trendPct: 3.2,
  }
}

export function computeMonthlySummary(): MonthlyPayrollSummary {
  const employees = payrollEmployees
  const grossSalary = employees.reduce((s, e) => s + e.gross, 0)
  const earnings = employees.reduce((s, e) => s + e.earnings, 0)
  const deductions = employees.reduce((s, e) => s + e.deductions, 0)
  const netPayroll = employees.reduce((s, e) => s + e.net, 0)
  return {
    totalEmployees: employees.length,
    grossSalary,
    earnings,
    deductions,
    netPayroll,
    pendingApproval: employees.filter((e) => e.status === 'Calculated').length,
    pendingPayment: employees.filter((e) => e.status === 'Approved').length,
  }
}

export function formatMoney(n: number, currency = '$') {
  return `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatMoneyShort(n: number, currency = '$') {
  if (n >= 1_000_000) return `${currency}${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}K`
  return formatMoney(n, currency)
}

export function updateSalaryStructure(
  employeeId: string,
  patch: { effectiveFrom: string; items: SalaryStructure['items'] },
): SalaryStructure {
  const prev = salaryStructures[employeeId]
  const next: SalaryStructure = {
    employeeId,
    effectiveFrom: patch.effectiveFrom,
    effectiveTo: null,
    currency: prev?.currency ?? 'USD',
    payFrequency: prev?.payFrequency ?? 'Monthly',
    status: 'ACTIVE',
    items: patch.items.map((i, idx) => ({
      ...i,
      id: i.id || `${employeeId}-${idx}-${Date.now()}`,
    })),
  }
  salaryStructures[employeeId] = next
  const gross = structureGross(next)
  const emp = payrollEmployees.find((e) => e.id === employeeId)
  if (emp) {
    emp.gross = gross
    emp.effectiveFrom = patch.effectiveFrom
  }
  return { ...next, items: next.items.map((i) => ({ ...i })) }
}
