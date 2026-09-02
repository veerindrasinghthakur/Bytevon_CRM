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
} from '../types'

export interface PayrollEmployeeListParams {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

/** Org-wide paid history row (history list page). */
export interface OrgPayrollHistoryRecord {
  id: string
  period: string
  employeeId: string
  paidOn: string
  gross: number
  net: number
  ref: string
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
        paidOn: r.paymentDate,
        gross: r.gross,
        net: r.net,
        ref: `TRX-${r.id.toUpperCase()}`,
      })
    }
  }
  // Current-period paid employees not already in history seed
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
  const { data } = await apiClient.get<PayrollKpis>('/payroll/kpis')
  return data
}

export async function getPayrollPeriodMeta(): Promise<PayrollPeriodMeta> {
  if (env.useMockApi) {
    await delay(200)
    return { ...periodMeta }
  }
  const { data } = await apiClient.get<PayrollPeriodMeta>('/payroll/period')
  return data
}

export async function listPayrollEmployees(
  params: PayrollEmployeeListParams = {},
): Promise<PayrollEmployeeListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<PayrollEmployeeListResponse>('/payroll/employees', {
      params: { ...params, page, pageSize },
    })
    return data
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
    const { data } = await apiClient.get<PayrollEmployeeRow>(`/payroll/employees/${encodeURIComponent(id)}`)
    return data
  } catch {
    return null
  }
}

export async function listPayrollActivity(): Promise<PayrollActivity[]> {
  if (env.useMockApi) {
    await delay(200)
    return recentActivity.map((a) => ({ ...a }))
  }
  const { data } = await apiClient.get<PayrollActivity[]>('/payroll/activity')
  return data
}

export async function getMonthlyPayrollSummary(): Promise<MonthlyPayrollSummary> {
  if (env.useMockApi) {
    await delay(200)
    return computeMonthlySummary()
  }
  const { data } = await apiClient.get<MonthlyPayrollSummary>('/payroll/monthly-summary')
  return data
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

/** Org-wide paid payroll history (mock aggregates historyByEmployee + current Paid rows). */
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
  const { data } = await apiClient.get<RunPayrollCheck[]>('/payroll/run/checks')
  return data
}

export async function getRunPayrollPreview() {
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
  const { data } = await apiClient.get('/payroll/run/preview')
  return data
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
