import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { computeReview, payrollEmployees } from '@/shared/mock/data/payroll'
import type { PayrollReviewDetail } from '../types'

/**
 * Resolve a URL id to a MonthlyPayroll.id.
 * Detail pages are keyed by payroll_id, but links/typed URLs sometimes carry an
 * employment_id — in that case fall back to the latest payroll for that employment.
 */
export async function resolvePayrollId(id: string): Promise<string | null> {
  try {
    await apiClient.get(`/payroll/${encodeURIComponent(id)}`)
    return id
  } catch {
    // Not a payroll_id — try employment_id (numeric ids usually land here).
  }
  if (!/^\d+$/.test(id)) return null
  try {
    const { data } = await apiClient.get<unknown>(`/payroll`, {
      params: { employment_id: id, limit: 1 },
    })
    const rows = Array.isArray(data) ? data : []
    const first = rows[0] as Record<string, unknown> | undefined
    const pid = first?.payrollId ?? first?.payroll_id ?? first?.id
    return pid != null && String(pid) !== '' ? String(pid) : null
  } catch {
    return null
  }
}

/** `id` is MonthlyPayroll.id (payroll_id); employment ids are auto-resolved. */
export async function getPayrollReview(id: string): Promise<PayrollReviewDetail | null> {
  if (env.useMockApi) {
    await delay(200)
    return computeReview(id)
  }
  // Backend returns a FLAT MonthlyPayrollResponse — project it to the nested
  // review shape (employee/periodLabel/attendance/items).
  const { toReviewDetail, fetchEmployeeRow } = await import('./_helpers')
  const { listPayrollEmployees } = await import('./monthly')
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
  // Already nested (mock-shaped or future backend)? pass through.
  if (flat.employee && typeof flat.employee === 'object') {
    return flat as unknown as PayrollReviewDetail
  }
  const employmentId = String(flat.employment_id ?? flat.employmentId ?? '')
  const empRow = employmentId
    ? await fetchEmployeeRow(employmentId, () =>
        listPayrollEmployees({ page: 1, pageSize: 500 }),
      )
    : null
  return toReviewDetail(flat, empRow)
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

export interface PayPayrollInput {
  ref?: string
  method?: string
  paymentDate?: string
  /** Local receipt screenshot (no backend column yet — sent as file_reference metadata). */
  receiptName?: string
  /** Manual payment: hand-entered amount + reason, tagged Manual (not system-calculated). */
  manualAmount?: number
  manualReason?: string
}

export async function payPayrollEmployee(
  id: string,
  ref?: string,
  method = 'BANK_TRANSFER',
  extra?: Omit<PayPayrollInput, 'ref' | 'method'>,
): Promise<void> {
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
    payment_method: method,
    payment_reference: ref ?? null,
    ...(extra?.paymentDate ? { payment_date: extra.paymentDate } : {}),
    // Extended manual-pay fields (backend migration pending; ignored until then).
    ...(extra?.receiptName ? { receipt_reference: extra.receiptName } : {}),
    ...(extra?.manualAmount != null ? { paid_amount: extra.manualAmount, is_manual: true } : {}),
    ...(extra?.manualReason ? { manual_reason: extra.manualReason } : {}),
  })
}

/** Recalculate / regenerate a row — POST /calculate (leaves, attendance, summary refreshed). */
export async function recalculatePayrollRow(input: {
  employmentId: number
  year: number
  month: number
}): Promise<void> {
  if (env.useMockApi) {
    await delay(600)
    return
  }
  await apiClient.post('/payroll/calculate', {
    employment_id: input.employmentId,
    year: input.year,
    month: input.month,
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
