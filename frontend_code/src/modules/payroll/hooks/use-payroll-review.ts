import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approvePayrollEmployee,
  getPayrollReview,
  payPayrollEmployee,
} from '../api/payroll'
import { formatMoney } from '../data/mock'

/** Review detail — all amounts from API/computeReview (structure + attendance + adjustments). */
export function usePayrollReview() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''
  const qc = useQueryClient()
  const [showPayModal, setShowPayModal] = useState(false)

  const query = useQuery({
    queryKey: ['payroll', 'review', id],
    queryFn: () => getPayrollReview(id),
    enabled: Boolean(id),
  })

  const review = query.data
  const emp = review?.employee

  const approveMut = useMutation({
    mutationFn: () => approvePayrollEmployee(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['payroll'] }),
  })
  const payMut = useMutation({
    mutationFn: (ref?: string) => payPayrollEmployee(id, ref),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['payroll'] }),
  })

  const attendanceSummary: [string, string][] = review
    ? [
        ['Working Days', String(review.attendance.workingDays)],
        ['Present Days', String(review.attendance.presentDays)],
        ['Paid Leave', String(review.attendance.paidLeave)],
        ['LOP Days', String(review.attendance.lopDays)],
        ['Working Hours', `${review.attendance.workingHours}h`],
        ['Overtime Hours', `${review.attendance.overtimeHours}h`],
      ]
    : []

  return {
    emp: emp ?? null,
    review,
    showPayModal,
    setShowPayModal,
    gross: review?.gross ?? 0,
    totalEarnings: review?.totalEarnings ?? 0,
    totalDeductions: review?.totalDeductions ?? 0,
    netAdj: review?.netAdjustments ?? 0,
    netPayable: review?.netPayable ?? 0,
    attendanceSummary,
    earnings: review?.earnings ?? [],
    deductions: review?.deductions ?? [],
    adjustments: review?.adjustments ?? [],
    formatMoney,
    periodLabel: review?.periodLabel ?? '',
    isLoading: query.isLoading,
    isError: query.isError || (!query.isLoading && !review),
    refetch: query.refetch,
    approveMut,
    payMut,
  }
}
