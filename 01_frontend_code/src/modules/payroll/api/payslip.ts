import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { computePayslip } from '@/shared/mock/data/payroll'
import type { PayslipDetail } from '../types'

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
