import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { computeReview, payrollEmployees } from '@/shared/mock/data/payroll'
import type { PayrollReviewDetail } from '../types'

/** `id` is MonthlyPayroll.id (payroll_id), not employment_id. */
export async function getPayrollReview(id: string): Promise<PayrollReviewDetail | null> {
  if (env.useMockApi) {
    await delay(200)
    return computeReview(id)
  }
  try {
    const { data } = await apiClient.get<PayrollReviewDetail>(
      `/payroll/${encodeURIComponent(id)}`,
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
  await apiClient.post(`/payroll/${encodeURIComponent(id)}/approve`)
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
  await apiClient.post(`/payroll/${encodeURIComponent(id)}/pay`, {
    payment_reference: ref,
    reference: ref,
  })
}

/** Monthly payroll reject — POST /payroll/{payroll_id}/reject */
export async function rejectPayroll(id: string, reason: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = payrollEmployees.find((e) => e.id === id)
    if (row) row.status = 'Calculated'
    return
  }
  await apiClient.post(`/payroll/${encodeURIComponent(id)}/reject`, { reason })
}
