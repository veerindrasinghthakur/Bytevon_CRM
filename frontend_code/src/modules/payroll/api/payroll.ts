/**
 * Payroll module API — mock via data/mock; real via shared Axios client.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import {
  monthlySummary,
  payrollEmployees,
  payrollKpis,
  periodMeta,
  recentActivity,
} from '../data/mock'
import type {
  MonthlyPayrollSummary,
  PayrollActivity,
  PayrollEmployeeRow,
  PayrollKpis,
  PayrollPeriodMeta,
} from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getPayrollKpis(): Promise<PayrollKpis> {
  if (env.useMockApi) {
    await delay()
    return { ...payrollKpis }
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
  const { data } = await apiClient.get<PayrollEmployeeRow>(
    `/payroll/employees/${encodeURIComponent(id)}`,
  )
  return data
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
    return { ...monthlySummary }
  }
  const { data } = await apiClient.get<MonthlyPayrollSummary>('/payroll/monthly-summary')
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
    return
  }
  await apiClient.post(`/payroll/employees/${encodeURIComponent(id)}/approve`)
}

export async function payPayrollEmployee(id: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    return
  }
  await apiClient.post(`/payroll/employees/${encodeURIComponent(id)}/pay`)
}
