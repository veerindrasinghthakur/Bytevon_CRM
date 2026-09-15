import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { computeReview, payrollEmployees } from '@/shared/mock/data/payroll'
import type { PayrollReviewDetail } from '../types'

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
