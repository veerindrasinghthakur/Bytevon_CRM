import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { payrollEmployees } from '@/shared/mock/data/payroll'
import type {
  MonthlyPayrollSummary,
  PayrollEmployeeListParams,
  PayrollEmployeeListResponse,
  PayrollEmployeeRow,
} from '../types'
import {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
  computeMonthlySummary,
  filterEmployees,
  normalizeEmployee,
  normalizeEmployeeList,
  num,
  paginateItems,
} from './_helpers'

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

/** Resolve by employment_id via list query (no dedicated employees/:id). */
export async function getPayrollEmployee(id: string): Promise<PayrollEmployeeRow | null> {
  if (env.useMockApi) {
    await delay(200)
    const row = payrollEmployees.find((e) => e.id === id) ?? null
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<unknown[]>('/payroll', {
      params: { employment_id: id, limit: 1 },
    })
    const rows = Array.isArray(data) ? data : []
    if (!rows.length) return null
    return normalizeEmployee(rows[0] as Record<string, unknown>)
  } catch {
    return null
  }
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
