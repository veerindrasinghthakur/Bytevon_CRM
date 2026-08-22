/**
 * Payroll module API — mock via data/mock compute helpers; real via Axios.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
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
} from '../data/mock'
import type {
  MonthlyPayrollSummary,
  PayrollActivity,
  PayrollEmployeeRow,
  PayrollHistoryRow,
  PayrollKpis,
  PayrollPeriodMeta,
  PayrollReviewDetail,
  PayslipDetail,
  RunPayrollCheck,
  SalaryItem,
  SalaryStructure,
} from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getPayrollKpis(): Promise<PayrollKpis> {
  if (env.useMockApi) {
    await delay()
    return computeKpis()
  }
  const { data } = await apiClient.get<PayrollKpis>('/payroll/kpis')
  return data
}

export async function getPayrollPeriodMeta(): Promise<PayrollPeriodMeta> {
  if (env.useMockApi) {
    await delay()
    return { ...periodMeta }
  }
  const { data } = await apiClient.get<PayrollPeriodMeta>('/payroll/period')
  return data
}

export async function listPayrollEmployees(params?: {
  search?: string
  status?: string
}): Promise<PayrollEmployeeRow[]> {
  if (env.useMockApi) {
    await delay()
    let items = payrollEmployees.map((r) => ({ ...r }))
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q),
      )
    }
    if (params?.status && params.status !== 'All') {
      items = items.filter((e) => e.status === params.status)
    }
    return items
  }
  const { data } = await apiClient.get<PayrollEmployeeRow[]>('/payroll/employees', { params })
  return data
}

export async function getPayrollEmployee(id: string): Promise<PayrollEmployeeRow | null> {
  if (env.useMockApi) {
    await delay()
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
    await delay()
    return recentActivity.map((a) => ({ ...a }))
  }
  const { data } = await apiClient.get<PayrollActivity[]>('/payroll/activity')
  return data
}

export async function getMonthlyPayrollSummary(): Promise<MonthlyPayrollSummary> {
  if (env.useMockApi) {
    await delay()
    return computeMonthlySummary()
  }
  const { data } = await apiClient.get<MonthlyPayrollSummary>('/payroll/monthly-summary')
  return data
}

export async function getPayrollReview(employeeId: string): Promise<PayrollReviewDetail | null> {
  if (env.useMockApi) {
    await delay()
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
    await delay()
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
    await delay()
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
  input: { effectiveFrom: string; items: SalaryItem[] },
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
    await delay()
    return (historyByEmployee[employeeId] ?? []).map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<PayrollHistoryRow[]>(
    `/payroll/employees/${encodeURIComponent(employeeId)}/history`,
  )
  return data
}

export async function getRunPayrollChecks(): Promise<RunPayrollCheck[]> {
  if (env.useMockApi) {
    await delay()
    return runPayrollChecks.map((c) => ({ ...c }))
  }
  const { data } = await apiClient.get<RunPayrollCheck[]>('/payroll/run/checks')
  return data
}

export async function getRunPayrollPreview() {
  if (env.useMockApi) {
    await delay()
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
