import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { payrollEmployees, runPayrollChecks } from '@/shared/mock/data/payroll'
import type { RunPayrollCheck, RunPayrollPreview } from '../types'
import { normalizeEmployee, num } from './_helpers'

export async function getRunPayrollChecks(): Promise<RunPayrollCheck[]> {
  if (env.useMockApi) {
    await delay(200)
    return runPayrollChecks.map((c) => ({ ...c }))
  }
  const { data } = await apiClient.get<unknown>('/payroll/run/checks')
  const list = Array.isArray(data) ? data : []
  return list.map((c) => {
    const r = (c ?? {}) as Record<string, unknown>
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
