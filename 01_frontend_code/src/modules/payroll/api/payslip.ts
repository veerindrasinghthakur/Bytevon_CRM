import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { computePayslip } from '@/shared/mock/data/payroll'
import type { PayslipDetail } from '../types'

/** `id` is MonthlyPayroll.id (payroll_id); employment ids are auto-resolved. */
export async function getPayslip(id: string): Promise<PayslipDetail | null> {
  if (env.useMockApi) {
    await delay(200)
    return computePayslip(id)
  }
  // Backend returns a FLAT MonthlyPayrollResponse — project it to the nested
  // payslip shape.
  const { toPayslipDetail, fetchEmployeeRow } = await import('./_helpers')
  const { listPayrollEmployees } = await import('./monthly')
  const { resolvePayrollId } = await import('./review')
  const fetchFlat = async (pid: string): Promise<Record<string, unknown> | null> => {
    try {
      const { data } = await apiClient.get<Record<string, unknown>>(
        `/payroll/${encodeURIComponent(pid)}`,
      )
      return data ?? null
    } catch {
      return null
    }
  }
  let flat = await fetchFlat(id)
  if (!flat) {
    const resolved = await resolvePayrollId(id)
    if (!resolved || resolved === id) return null
    flat = await fetchFlat(resolved)
    if (!flat) return null
  }
  if (flat.employee && typeof flat.employee === 'object') {
    return flat as unknown as PayslipDetail
  }
  const employmentId = String(flat.employment_id ?? flat.employmentId ?? '')
  const empRow = employmentId
    ? await fetchEmployeeRow(employmentId, () =>
        listPayrollEmployees({ page: 1, pageSize: 500 }),
      )
    : null
  return toPayslipDetail(flat, empRow)
}
