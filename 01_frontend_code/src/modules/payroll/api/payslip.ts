import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { computePayslip } from '@/shared/mock/data/payroll'
import type { PayslipDetail } from '../types'

/** `id` is MonthlyPayroll.id (payroll_id). */
export async function getPayslip(id: string): Promise<PayslipDetail | null> {
  if (env.useMockApi) {
    await delay(200)
    return computePayslip(id)
  }
  try {
    const { data } = await apiClient.get<PayslipDetail>(`/payroll/${encodeURIComponent(id)}`)
    return data
  } catch {
    return null
  }
}
