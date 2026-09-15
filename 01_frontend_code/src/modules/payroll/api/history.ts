import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { historyByEmployee, payrollEmployees } from '@/shared/mock/data/payroll'
import type { OrgPayrollHistoryRecord, PayrollHistoryRow } from '../types'
import { buildOrgPaidHistory } from './_helpers'

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
