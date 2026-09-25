/** Shared payroll API normalizers — used by domain API modules. */
import { paginateItems, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE } from '@/shared/lib/list-params'
import {
  computeMonthlySummary,
  historyByEmployee,
  periodMeta,
  payrollEmployees,
} from '@/shared/mock/data/payroll'
import type {
  PayrollActivity,
  PayrollEmployeeListResponse,
  PayrollEmployeeRow,
  PayrollHistoryRow,
  PayrollKpis,
  PayrollPeriodMeta,
  PayrollEmployeeListParams,
  OrgPayrollHistoryRecord,
} from '../types'

export function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return fallback
}

export function monthName(index: number): string {
  const names = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return names[index] ?? String(index)
}

export function normalizeKpis(raw: Record<string, unknown> | null | undefined): PayrollKpis {
  const r = raw ?? {}
  return {
    totalPayroll: num(r.totalPayroll ?? r.totalNet ?? r.total_net ?? r.netPayroll),
    totalEmployees: num(r.totalEmployees ?? r.employees ?? r.employeeCount),
    pendingApproval: num(r.pendingApproval ?? r.pendingCount ?? r.pending),
    pendingPayment: num(r.pendingPayment ?? r.paidCount === undefined ? 0 : 0),
    trendPct: num(r.trendPct, 0),
  }
}

export function normalizePeriod(raw: Record<string, unknown> | null | undefined): PayrollPeriodMeta {
  const r = raw ?? {}
  const year = num(r.year, new Date().getFullYear())
  const monthIndex = num(r.monthIndex ?? r.month, new Date().getMonth() + 1)
  const month =
    typeof r.month === 'string' && Number.isNaN(Number(r.month))
      ? String(r.month)
      : monthName(monthIndex)
  const statusRaw = String(r.status ?? 'In Progress')
  const status =
    statusRaw === 'Completed' || statusRaw === 'Draft' || statusRaw === 'In Progress'
      ? statusRaw
      : 'In Progress'
  return {
    month,
    year,
    monthIndex,
    label: String(r.label ?? `${month} ${year} Payroll`),
    status: status as PayrollPeriodMeta['status'],
    calculated: num(r.calculated ?? r.employees ?? r.totalEmployees),
    approved: num(r.approved),
    paid: num(r.paid ?? r.paidCount),
  }
}

export function normalizeActivity(raw: unknown): PayrollActivity[] {
  const list = Array.isArray(raw) ? raw : []
  return list.map((item, idx) => {
    const r = (item ?? {}) as Record<string, unknown>
    return {
      id: String(r.id ?? idx),
      text: String(r.text ?? r.title ?? r.message ?? 'Payroll activity'),
      time: String(r.time ?? r.created_at ?? r.updated_at ?? ''),
      primary: Boolean(r.primary ?? idx === 0),
    }
  })
}

function mapStatus(s: unknown): PayrollEmployeeRow['status'] {
  const v = String(s ?? 'Calculated').toUpperCase()
  if (v === 'PAID' || v === 'APPROVED' || v === 'PENDING') {
    if (v === 'PAID') return 'Paid'
    if (v === 'APPROVED') return 'Approved'
    return 'Pending'
  }
  if (v === 'CALCULATED' || v === 'DRAFT') return 'Calculated'
  if (['Calculated', 'Approved', 'Paid', 'Pending'].includes(String(s))) {
    return String(s) as PayrollEmployeeRow['status']
  }
  return 'Calculated'
}

export function normalizeEmployee(raw: Record<string, unknown>): PayrollEmployeeRow {
  const employmentIdRaw = raw.employmentId ?? raw.employment_id ?? raw.id ?? ''
  const name = String(
    raw.name ?? raw.full_name ?? raw.fullName ?? `Employee #${employmentIdRaw}`,
  )
  const initials =
    String(raw.initials ?? '')
      .trim() ||
    name
      .split(/\s+/)
      .map((p) => p[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    'E'
  return {
    id: String(raw.id ?? raw.employmentId ?? ''),
    payrollId:
      raw.payrollId != null || raw.payroll_id != null
        ? String(raw.payrollId ?? raw.payroll_id)
        : String(raw.id ?? ''),
    employmentId:
      raw.employmentId != null || raw.employment_id != null
        ? String(raw.employmentId ?? raw.employment_id)
        : undefined,
    name,
    code: String(
      raw.code ?? raw.employee_code ?? raw.employeeCode ?? `EMP-${employmentIdRaw}`,
    ),
    role: String(
      raw.role ?? raw.role_name ?? raw.title ?? raw.position ?? raw.designation ?? '—',
    ),
    department: String(
      raw.department ?? raw.department_name ?? raw.dept ?? '—',
    ),
    initials,
    gross: num(raw.gross),
    earnings: num(raw.earnings),
    deductions: num(raw.deductions),
    net: num(raw.net),
    status: mapStatus(raw.status),
    paymentRef:
      raw.paymentRef != null || raw.payment_reference != null
        ? String(raw.paymentRef ?? raw.payment_reference)
        : undefined,
    effectiveFrom:
      raw.effectiveFrom != null
        ? String(raw.effectiveFrom)
        : raw.effective_from != null
          ? String(raw.effective_from)
          : undefined,
    salaryStatus:
      raw.salaryStatus != null
        ? (String(raw.salaryStatus) as PayrollEmployeeRow['salaryStatus'])
        : undefined,
  }
}

export function normalizeEmployeeList(data: unknown): PayrollEmployeeListResponse {
  const raw = (data ?? {}) as Record<string, unknown>
  const source = Array.isArray(data)
    ? data
    : Array.isArray(raw.items)
      ? raw.items
      : []
  const items = source.map((row) => normalizeEmployee((row ?? {}) as Record<string, unknown>))
  const total = num(raw.total, items.length)
  const page = num(raw.page, 1)
  const pageSize = num(raw.pageSize, items.length || 20)
  const metricsRaw = (raw.metrics ?? {}) as Record<string, unknown>
  return {
    items,
    total,
    page,
    pageSize,
    metrics: {
      totalEmployees: num(metricsRaw.totalEmployees ?? metricsRaw.count, items.length),
      grossSalary: num(metricsRaw.grossSalary ?? metricsRaw.totalGross),
      earnings: num(metricsRaw.earnings),
      deductions: num(metricsRaw.deductions),
      netPayroll: num(metricsRaw.netPayroll ?? metricsRaw.totalNet),
      pendingApproval: num(metricsRaw.pendingApproval),
      pendingPayment: num(metricsRaw.pendingPayment),
    },
  }
}

function mapHistoryStatus(s: unknown): PayrollHistoryRow['status'] {
  const v = String(s ?? 'CALCULATED').toUpperCase()
  if (v === 'PAID') return 'PAID'
  if (v === 'APPROVED') return 'APPROVED'
  return 'CALCULATED'
}

/** Map a backend history dict (period "YYYY-MM", paidOn, payrollId) to PayrollHistoryRow. */
export function normalizeHistoryRow(raw: Record<string, unknown>): PayrollHistoryRow {
  const period = String(raw.period ?? '')
  const m = period.match(/^(\d{4})-(\d{1,2})$/)
  const year = num(raw.year, m ? Number(m[1]) : new Date().getFullYear())
  const monthIndex = num(raw.monthIndex, m ? Number(m[2]) : 1)
  const month =
    typeof raw.month === 'string' && raw.month.trim() !== ''
      ? String(raw.month)
      : monthName(monthIndex)
  const paidOn = raw.paymentDate ?? raw.paidOn
  return {
    id: String(raw.id ?? raw.payrollId ?? raw.payroll_id ?? ''),
    payrollId:
      raw.payrollId != null || raw.payroll_id != null
        ? String(raw.payrollId ?? raw.payroll_id)
        : String(raw.id ?? ''),
    month,
    year,
    gross: num(raw.gross ?? raw.grossSalary),
    earnings: num(raw.earnings ?? raw.totalEarnings),
    deductions: num(raw.deductions ?? raw.totalDeductions),
    adjustments: num(raw.adjustments ?? raw.netAdjustments),
    net: num(raw.net ?? raw.netSalary),
    paymentDate: paidOn != null && String(paidOn).trim() !== '' ? String(paidOn) : null,
    status: mapHistoryStatus(raw.status),
  }
}

export function filterEmployees(params: PayrollEmployeeListParams = {}): PayrollEmployeeRow[] {
  let items = payrollEmployees.map((r) => ({ ...r }))
  if (params.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q),
    )
  }
  if (params.status && params.status !== 'All') {
    items = items.filter((e) => e.status === params.status)
  }
  return items
}

export function buildOrgPaidHistory(): OrgPayrollHistoryRecord[] {  const fromHistory: OrgPayrollHistoryRecord[] = []
  for (const [employeeId, rows] of Object.entries(historyByEmployee)) {
    for (const r of rows) {
      if (r.status !== 'PAID') continue
      fromHistory.push({
        id: r.id,
        period: r.month,
        employeeId,
        paidOn: r.paymentDate ?? '',
        gross: r.gross,
        net: r.net,
        ref: `TRX-${r.id.toUpperCase()}`,
      })
    }
  }
  for (const e of payrollEmployees) {
    if (e.status !== 'Paid') continue
    if (
      fromHistory.some(
        (h) => h.employeeId === e.id && h.period.includes(String(periodMeta.year)),
      )
    ) {
      continue
    }
    fromHistory.push({
      id: `paid-${e.id}`,
      period: periodMeta.label,
      employeeId: e.id,
      paidOn: '2026-08-31',
      gross: e.gross,
      net: e.net,
      ref: e.paymentRef ?? `TRX-${e.code}`,
    })
  }
  return fromHistory
}

export { paginateItems, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE, computeMonthlySummary }

/**
 * Backend GET /payroll/{payroll_id} returns a FLAT MonthlyPayrollResponse
 * (id, employment_id, gross_salary, items[]…). Detail pages need the nested
 * review/payslip shapes, so project the flat row here. Employee display
 * (name/code/department/role) comes from the employees-list row when available.
 */
export function toReviewDetail(
  flat: Record<string, unknown>,
  empRow?: PayrollEmployeeRow | null,
): import('../types').PayrollReviewDetail {
  const employmentId = String(flat.employment_id ?? flat.employmentId ?? empRow?.employmentId ?? '')
  const year = num(flat.year, new Date().getFullYear())
  const monthIndex = num(flat.month ?? flat.monthIndex, new Date().getMonth() + 1)
  const items = (Array.isArray(flat.items) ? flat.items : []) as Array<Record<string, unknown>>
  const earnings = items
    .filter((i) => String(i.type).toUpperCase() === 'EARNING')
    .map((i) => ({ name: String(i.name ?? ''), amount: num(i.amount) }))
  const deductions = items
    .filter((i) => String(i.type).toUpperCase() === 'DEDUCTION')
    .map((i) => ({ name: String(i.name ?? ''), amount: num(i.amount) }))
  const adjustments = items
    .filter((i) => String(i.type).toUpperCase() === 'ADJUSTMENT')
    .map((i, idx) => ({
      id: String(i.id ?? idx),
      title: String(i.name ?? 'Adjustment'),
      detail: String(i.description ?? ''),
      amount: num(i.amount),
    }))
  const gross = num(flat.gross_salary ?? flat.gross ?? empRow?.gross)
  const totalEarnings = num(flat.total_earnings ?? flat.totalEarnings ?? empRow?.earnings)
  const totalDeductions = num(flat.total_deductions ?? flat.totalDeductions ?? empRow?.deductions)
  const netAdjustments = adjustments.reduce((s, a) => s + a.amount, 0)
  const netPayable = num(flat.net_salary ?? flat.netSalary ?? flat.net ?? empRow?.net)
  const payable = num(flat.payable_days ?? flat.payableDays)
  const lop = num(flat.lop_days ?? flat.lopDays)
  const employee: PayrollEmployeeRow = empRow
    ? {
        ...empRow,
        payrollId: String(flat.payroll_id ?? flat.payrollId ?? flat.id ?? empRow.payrollId ?? empRow.id),
        gross,
        earnings: totalEarnings,
        deductions: totalDeductions,
        net: netPayable,
        status: mapStatus(flat.status),
        paymentRef:
          flat.payment_reference != null || flat.paymentReference != null
            ? String(flat.payment_reference ?? flat.paymentReference)
            : empRow.paymentRef,
      }
    : normalizeEmployee({ ...flat, id: flat.id, payrollId: flat.payroll_id ?? flat.id })
  return {
    employee,
    periodLabel: `${monthName(monthIndex)} ${year}`,
    attendance: {
      workingDays: payable + lop,
      presentDays: payable,
      paidLeave: 0,
      lopDays: lop,
      workingHours: 0,
      overtimeHours: 0,
    },
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

/** Flat payroll row + employee row → payslip detail shape. */
export function toPayslipDetail(
  flat: Record<string, unknown>,
  empRow?: PayrollEmployeeRow | null,
): import('../types').PayslipDetail {
  const review = toReviewDetail(flat, empRow)
  const paymentDate = flat.payment_date ?? flat.paymentDate ?? flat.paidOn
  return {
    employee: review.employee,
    periodLabel: review.periodLabel,
    paymentDate:
      paymentDate != null && String(paymentDate).trim() !== '' ? String(paymentDate) : '—',
    paymentMethod: String(flat.payment_method ?? flat.paymentMethod ?? 'Bank Transfer'),
    referenceNumber: String(
      flat.payment_reference ?? flat.paymentReference ?? review.employee.paymentRef ?? '—',
    ),
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

/** Employee display row for an employment (name/code/department/role). */
export async function fetchEmployeeRow(
  employmentId: string,
  fetcher: () => Promise<PayrollEmployeeListResponse>,
): Promise<PayrollEmployeeRow | null> {
  try {
    const list = await fetcher()
    return list.items.find((e) => String(e.employmentId ?? '') === String(employmentId)) ?? null
  } catch {
    return null
  }
}

/**
 * Header fallback for salary/history pages when the employment has no
 * calculated monthly rows yet (fresh or future-dated first version).
 * Maps a workforce employee detail DTO (any shape) to a display row.
 */
export function fallbackEmployeeRow(detail: unknown, id: string): PayrollEmployeeRow | null {
  if (!detail || typeof detail !== 'object') return null
  const d = detail as Record<string, unknown>
  const employment = (d.employment ?? {}) as Record<string, unknown>
  const person = (d.person ?? {}) as Record<string, unknown>
  const code = String(employment.employee_code ?? employment.employeeCode ?? `EMP-${id}`)
  const first = String(person.first_name ?? person.firstName ?? '')
  const last = String(person.last_name ?? person.lastName ?? '')
  const name =
    `${first} ${last}`.trim() ||
    String(d.fullName ?? person.full_name ?? '') ||
    code
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'E'
  const department = d.department ?? employment.department ?? (d as Record<string, unknown>).department_name
  const role = d.role ?? employment.role ?? (d as Record<string, unknown>).position ?? (d as Record<string, unknown>).title
  return {
    id: String(employment.id ?? d.id ?? id),
    payrollId: undefined,
    employmentId: id,
    name,
    code,
    role: role != null && String(role).trim() !== '' ? String(role) : '—',
    department: department != null && String(department).trim() !== '' ? String(department) : '—',
    initials,
    gross: 0,
    earnings: 0,
    deductions: 0,
    net: 0,
    status: 'Calculated',
  }
}
