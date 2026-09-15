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
  const name = String(raw.name ?? `Employee #${raw.employmentId ?? raw.id ?? ''}`)
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
    name,
    code: String(raw.code ?? `EMP-${raw.employmentId ?? raw.id ?? ''}`),
    role: String(raw.role ?? '—'),
    department: String(raw.department ?? '—'),
    initials,
    gross: num(raw.gross),
    earnings: num(raw.earnings),
    deductions: num(raw.deductions),
    net: num(raw.net),
    status: mapStatus(raw.status),
    paymentRef: raw.paymentRef != null ? String(raw.paymentRef) : undefined,
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

export function buildOrgPaidHistory(): OrgPayrollHistoryRecord[] {
  const fromHistory: OrgPayrollHistoryRecord[] = []
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
