/**
 * Payroll module API — mock via shared/mock/data/payroll; real via Axios.
 * List endpoints return paginated PayrollEmployeeListResponse.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE } from '@/shared/lib/list-params'
import {
  computeKpis,
  computeMonthlySummary,
  computePayslip,
  computeReview,
  historyByEmployee,
  periodMeta,
  payrollEmployees,
  recentActivity,
  runPayrollChecks,
  salaryStructures,
  updateSalaryStructure,
} from '@/shared/mock/data/payroll'
import type {
  MonthlyPayrollSummary,
  PayrollActivity,
  PayrollEmployeeListResponse,
  PayrollEmployeeRow,
  PayrollHistoryRow,
  PayrollKpis,
  PayrollPeriodMeta,
  PayrollReviewDetail,
  PayslipDetail,
  RunPayrollCheck,
  SalaryItem,
  SalaryStructure,
  SaveSalaryStructureInput,
  PayrollEmployeeListParams,
  OrgPayrollHistoryRecord,
  RunPayrollPreview,
} from '../types'

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return fallback
}

function monthName(index: number): string {
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

/** Backend may return alternate field names — always produce UI PayrollKpis. */
function normalizeKpis(raw: Record<string, unknown> | null | undefined): PayrollKpis {
  const r = raw ?? {}
  return {
    totalPayroll: num(r.totalPayroll ?? r.totalNet ?? r.total_net ?? r.netPayroll),
    totalEmployees: num(r.totalEmployees ?? r.employees ?? r.employeeCount),
    pendingApproval: num(r.pendingApproval ?? r.pendingCount ?? r.pending),
    pendingPayment: num(r.pendingPayment ?? r.paidCount === undefined ? 0 : 0),
    trendPct: num(r.trendPct, 0),
  }
}

function normalizePeriod(raw: Record<string, unknown> | null | undefined): PayrollPeriodMeta {
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

function normalizeActivity(raw: unknown): PayrollActivity[] {
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

function normalizeEmployee(raw: Record<string, unknown>): PayrollEmployeeRow {
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

function normalizeEmployeeList(data: unknown): PayrollEmployeeListResponse {
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

function filterEmployees(params: PayrollEmployeeListParams = {}): PayrollEmployeeRow[] {
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

function buildOrgPaidHistory(): OrgPayrollHistoryRecord[] {
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
    if (fromHistory.some((h) => h.employeeId === e.id && h.period.includes(String(periodMeta.year)))) {
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

export async function getPayrollKpis(): Promise<PayrollKpis> {
  if (env.useMockApi) {
    await delay(200)
    return computeKpis()
  }
  const { data } = await apiClient.get<Record<string, unknown>>('/payroll/kpis')
  return normalizeKpis(data)
}

export async function getPayrollPeriodMeta(): Promise<PayrollPeriodMeta> {
  if (env.useMockApi) {
    await delay(200)
    return { ...periodMeta }
  }
  const { data } = await apiClient.get<Record<string, unknown>>('/payroll/period')
  return normalizePeriod(data)
}

export async function listPayrollEmployees(
  params: PayrollEmployeeListParams = {},
): Promise<PayrollEmployeeListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<unknown>('/payroll/employees', {
      params: { ...params, page, pageSize },
    })
    return normalizeEmployeeList(data)
  }

  await delay(200)
  const filtered = filterEmployees(params)
  const metrics = computeMonthlySummary(filtered)
  const { items, total } = paginateItems(filtered, page, pageSize)
  return { items, total, page, pageSize, metrics }
}

export async function getPayrollEmployee(id: string): Promise<PayrollEmployeeRow | null> {
  if (env.useMockApi) {
    await delay(200)
    const row = payrollEmployees.find((e) => e.id === id) ?? null
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(
      `/payroll/employees/${encodeURIComponent(id)}`,
    )
    return normalizeEmployee(data)
  } catch {
    return null
  }
}

export async function listPayrollActivity(): Promise<PayrollActivity[]> {
  if (env.useMockApi) {
    await delay(200)
    return recentActivity.map((a) => ({ ...a }))
  }
  const { data } = await apiClient.get<unknown>('/payroll/activity')
  return normalizeActivity(data)
}

export async function getMonthlyPayrollSummary(): Promise<MonthlyPayrollSummary> {
  if (env.useMockApi) {
    await delay(200)
    return computeMonthlySummary()
  }
  const { data } = await apiClient.get<Record<string, unknown>>('/payroll/monthly-summary')
  const r = data ?? {}
  return {
    totalEmployees: num(r.totalEmployees ?? r.employeeCount),
    grossSalary: num(r.grossSalary ?? r.totalGross),
    earnings: num(r.earnings),
    deductions: num(r.deductions ?? r.totalDeductions),
    netPayroll: num(r.netPayroll ?? r.totalNet),
    pendingApproval: num(r.pendingApproval),
    pendingPayment: num(r.pendingPayment),
  }
}

export async function getPayrollReview(employeeId: string): Promise<PayrollReviewDetail | null> {
  if (env.useMockApi) {
    await delay(200)
    return computeReview(employeeId)
  }
  try {
    const { data } = await apiClient.get<PayrollReviewDetail>(
      `/payroll/employees/${encodeURIComponent(employeeId)}/review`,
    )
    return data
  } catch {
    return null
  }
}

export async function getPayslip(employeeId: string): Promise<PayslipDetail | null> {
  if (env.useMockApi) {
    await delay(200)
    return computePayslip(employeeId)
  }
  try {
    const { data } = await apiClient.get<PayslipDetail>(
      `/payroll/employees/${encodeURIComponent(employeeId)}/payslip`,
    )
    return data
  } catch {
    return null
  }
}

export async function getSalaryStructure(employeeId: string): Promise<SalaryStructure | null> {
  if (env.useMockApi) {
    await delay(200)
    const s = salaryStructures[employeeId]
    if (!s) return null
    return { ...s, items: s.items.map((i) => ({ ...i })) }
  }
  try {
    const { data } = await apiClient.get<SalaryStructure>(
      `/payroll/employees/${encodeURIComponent(employeeId)}/salary`,
    )
    return data
  } catch {
    return null
  }
}

export async function saveSalaryStructure(
  employeeId: string,
  input: SaveSalaryStructureInput | { effectiveFrom: string; items: SalaryItem[] },
): Promise<SalaryStructure> {
  if (env.useMockApi) {
    await delay(400)
    return updateSalaryStructure(employeeId, input)
  }
  const { data } = await apiClient.put<SalaryStructure>(
    `/payroll/employees/${encodeURIComponent(employeeId)}/salary`,
    input,
  )
  return data
}

export async function listEmployeePayrollHistory(employeeId: string): Promise<PayrollHistoryRow[]> {
  if (env.useMockApi) {
    await delay(200)
    return (historyByEmployee[employeeId] ?? []).map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<PayrollHistoryRow[]>(
    `/payroll/employees/${encodeURIComponent(employeeId)}/history`,
  )
  return data
}

export async function listOrgPayrollHistory(search?: string): Promise<OrgPayrollHistoryRecord[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<OrgPayrollHistoryRecord[]>('/payroll/history', {
      params: search ? { search } : undefined,
    })
    return data
  }
  await delay(200)
  let rows = buildOrgPaidHistory()
  if (search?.trim()) {
    const q = search.toLowerCase()
    rows = rows.filter((r) => {
      const emp = payrollEmployees.find((e) => e.id === r.employeeId)
      return (
        r.period.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q) ||
        emp?.name.toLowerCase().includes(q) ||
        emp?.code.toLowerCase().includes(q)
      )
    })
  }
  return rows
}

export async function getRunPayrollChecks(): Promise<RunPayrollCheck[]> {
  if (env.useMockApi) {
    await delay(200)
    return runPayrollChecks.map((c) => ({ ...c }))
  }
  const { data } = await apiClient.get<unknown>('/payroll/run/checks')
  const list = Array.isArray(data) ? data : []
  return list.map((c) => {
    const r = (c ?? {}) as Record<string, unknown>
    // Backend stub uses { id, label, status: 'ok'|'warn' }
    if ('ok' in r || 'title' in r) {
      return {
        ok: Boolean(r.ok ?? r.status === 'ok'),
        title: String(r.title ?? r.label ?? 'Check'),
        detail: String(r.detail ?? r.label ?? ''),
      }
    }
    return {
      ok: String(r.status ?? 'ok') === 'ok',
      title: String(r.label ?? r.id ?? 'Check'),
      detail: String(r.detail ?? ''),
    }
  })
}

export async function getRunPayrollPreview(): Promise<RunPayrollPreview> {
  if (env.useMockApi) {
    await delay(200)
    const employees = payrollEmployees.map((r) => ({ ...r }))
    return {
      employees,
      totalGross: employees.reduce((s, e) => s + e.gross, 0),
      totalEarnings: employees.reduce((s, e) => s + e.earnings, 0),
      totalDeductions: employees.reduce((s, e) => s + e.deductions, 0),
      estimatedNet: employees.reduce((s, e) => s + e.net, 0),
    }
  }
  const { data } = await apiClient.get<Record<string, unknown>>('/payroll/run/preview')
  const employeesRaw = Array.isArray(data?.employees) ? data.employees : []
  const employees = employeesRaw.map((row) =>
    normalizeEmployee((row ?? {}) as Record<string, unknown>),
  )
  return {
    employees,
    totalGross: num(data?.totalGross),
    totalEarnings: num(data?.totalEarnings),
    totalDeductions: num(data?.totalDeductions),
    estimatedNet: num(data?.estimatedNet),
  }
}

export async function runPayroll(period: { year: number; month: number }): Promise<void> {
  if (env.useMockApi) {
    await delay(600)
    return
  }
  await apiClient.post('/payroll/run', period)
}

export async function approvePayrollEmployee(id: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = payrollEmployees.find((e) => e.id === id)
    if (row) row.status = 'Approved'
    return
  }
  await apiClient.post(`/payroll/employees/${encodeURIComponent(id)}/approve`)
}

export async function payPayrollEmployee(id: string, ref?: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = payrollEmployees.find((e) => e.id === id)
    if (row) {
      row.status = 'Paid'
      row.paymentRef = ref ?? `TRX-${Date.now().toString().slice(-6)}`
    }
    return
  }
  await apiClient.post(`/payroll/employees/${encodeURIComponent(id)}/pay`, { reference: ref })
}
