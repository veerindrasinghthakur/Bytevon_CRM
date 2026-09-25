import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { formatMoney } from '@/shared/mock/data/payroll'
import {
  approvePayrollEmployee,
  getPayrollReview,
  payPayrollEmployee,
  rejectPayroll,
} from '../../api/review'

export function usePayrollReview() {
  const { payrollId, employeeId } = useParams({ strict: false }) as {
    payrollId?: string
    employeeId?: string
  }
  const id = payrollId ?? employeeId ?? ''
  const qc = useQueryClient()
  const [showPayModal, setShowPayModal] = useState(false)
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [receiptFiles, setReceiptFiles] = useState<File[]>([])

  const query = useQuery({
    queryKey: queryKeys.payroll.review(id),
    queryFn: () => getPayrollReview(id),
    enabled: Boolean(id),
  })

  const review = query.data
  const emp = review?.employee

  const approveMut = useMutation({
    mutationFn: () => approvePayrollEmployee(id),
    onSuccess: () => invalidate.payroll(qc),
  })
  const payMut = useMutation({
    mutationFn: (input?: { ref?: string; method?: string; paymentDate?: string; receiptName?: string }) =>
      payPayrollEmployee(id, input?.ref, input?.method ?? paymentMethod, {
        paymentDate: input?.paymentDate ?? paymentDate,
        receiptName: input?.receiptName ?? receiptFiles[0]?.name,
      }),
    onSuccess: () => invalidate.payroll(qc),
  })
  const rejectMut = useMutation({
    mutationFn: (reason: string) => rejectPayroll(id, reason),
    onSuccess: () => invalidate.payroll(qc),
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
    paymentRef,
    setPaymentRef,
    paymentMethod,
    setPaymentMethod,
    paymentDate,
    setPaymentDate,
    receiptFiles,
    setReceiptFiles,
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
    rejectMut,
  }
}

export function useRejectPayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPayroll(id, reason),
    onSuccess: () => invalidate.payroll(qc),
  })
}
