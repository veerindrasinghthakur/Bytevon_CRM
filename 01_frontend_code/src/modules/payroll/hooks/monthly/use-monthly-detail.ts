import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { apiClient } from '@/shared/lib/axios'
import { env } from '@/config/env'
import { formatMoney } from '@/shared/mock/data/payroll'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'
import {
  approvePayrollEmployee,
  getPayrollReview,
  payPayrollEmployee,
  recalculatePayrollRow,
  rejectPayroll,
} from '../../api/review'
import type { ManualPayForm } from '../../components/review/ManualPayModal'

export interface AttendanceDetail {
  presentDays: number
  absentDays: number
  halfDays: number
  onLeaveDays: number
  holidayDays: number
  weekOffDays: number
  workingHours: number
  overtimeHours: number
  attendancePct: number
  breakMinutes: number
  lateCount: number | null
  earlyDepartures: number | null
}

async function getAttendanceDetail(
  employmentId: string | undefined,
  year: number,
  month: number,
): Promise<AttendanceDetail | null> {
  if (!employmentId) return null
  if (env.useMockApi) return null
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(
      `/workforce/attendance/summaries/${encodeURIComponent(employmentId)}/${year}/${month}`,
    )
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v ?? 0) || 0)
    const intOrNull = (v: unknown) =>
      v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null
    return {
      presentDays: num(data.present_days ?? data.presentDays),
      absentDays: num(data.absent_days ?? data.absentDays),
      halfDays: num(data.half_days ?? data.halfDays),
      onLeaveDays: num(data.on_leave_days ?? data.onLeaveDays),
      holidayDays: num(data.holiday_days ?? data.holidayDays),
      weekOffDays: num(data.week_off_days ?? data.weekOffDays),
      workingHours: num(data.working_hours ?? data.workingHours),
      overtimeHours: num(data.overtime_hours ?? data.overtimeHours),
      attendancePct: num(data.attendance_percentage ?? data.attendancePct),
      breakMinutes: num(data.break_minutes ?? data.breakMinutes),
      lateCount: intOrNull(data.late_count ?? data.lateCount),
      earlyDepartures: intOrNull(data.early_departure_count ?? data.earlyDepartures),
    }
  } catch {
    return null
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function parsePeriodLabel(label: string): { year: number; month: number } | null {
  const iso = label.match(/(\d{4})-(\d{1,2})/)
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]) }
  const named = label.match(/([A-Za-z]+)\s+(\d{4})/)
  if (named) {
    const idx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === named[1].toLowerCase())
    if (idx >= 0) return { year: Number(named[2]), month: idx + 1 }
  }
  return null
}

export function useMonthlyDetail() {
  const { payrollId } = useParams({ strict: false }) as { payrollId?: string }
  const id = payrollId ?? ''
  const qc = useQueryClient()

  const [showPayModal, setShowPayModal] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [receiptFiles, setReceiptFiles] = useState<File[]>([])
  const [manualForm, setManualForm] = useState<ManualPayForm>({
    amount: '',
    reason: '',
    method: 'BANK_TRANSFER',
    paymentRef: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    receiptFiles: [],
  })

  const query = useQuery({
    queryKey: queryKeys.payroll.review(id),
    queryFn: () => getPayrollReview(id),
    enabled: Boolean(id),
  })
  const review = query.data
  const emp = review?.employee ?? null

  const yearMonth = (() => {
    const parsed = parsePeriodLabel(review?.periodLabel ?? '')
    if (parsed) return parsed
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() + 1 }
  })()

  const attendanceQuery = useQuery({
    queryKey: ['payroll', 'monthly-attendance', emp?.employmentId ?? emp?.id, yearMonth.year, yearMonth.month] as const,
    queryFn: () => getAttendanceDetail(emp?.employmentId ?? emp?.id, yearMonth.year, yearMonth.month),
    enabled: Boolean(emp),
  })

  const recalcMut = useMutation({
    mutationFn: () =>
      recalculatePayrollRow({
        employmentId: Number(emp?.employmentId ?? emp?.id ?? 0),
        year: yearMonth.year,
        month: yearMonth.month,
      }),
    onSuccess: () => {
      void invalidate.payroll(qc)
      toast.success('Monthly summary regenerated — leaves and attendance refreshed')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not recalculate this row'))
    },
  })
  const approveMut = useMutation({
    mutationFn: () => approvePayrollEmployee(id),
    onSuccess: () => {
      void invalidate.payroll(qc)
      toast.success('Payroll approved')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not approve'))
    },
  })
  const rejectMut = useMutation({
    mutationFn: (reason: string) => rejectPayroll(id, reason),
    onSuccess: () => {
      void invalidate.payroll(qc)
      toast.success('Payroll sent back to Calculated')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not reject'))
    },
  })
  const payMut = useMutation({
    mutationFn: () =>
      payPayrollEmployee(id, paymentRef || undefined, paymentMethod, {
        paymentDate,
        receiptName: receiptFiles[0]?.name,
      }),
    onSuccess: () => {
      void invalidate.payroll(qc)
      toast.success('Payment recorded — payslip entry created')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not record payment'))
    },
  })
  const manualPayMut = useMutation({
    mutationFn: () =>
      payPayrollEmployee(id, manualForm.paymentRef || undefined, manualForm.method, {
        paymentDate: manualForm.paymentDate,
        receiptName: manualForm.receiptFiles[0]?.name,
        manualAmount: Number(manualForm.amount),
        manualReason: manualForm.reason.trim(),
      }),
    onSuccess: () => {
      void invalidate.payroll(qc)
      toast.success('Manual payment recorded — tagged Manual')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not record manual payment'))
    },
  })

  return {
    id,
    emp,
    review,
    attendance: attendanceQuery.data,
    attendanceLoading: attendanceQuery.isLoading,
    yearMonth,
    formatMoney,
    isLoading: query.isLoading,
    isError: query.isError || (!query.isLoading && !review),
    refetch: query.refetch,
    showPayModal,
    setShowPayModal,
    showManualModal,
    setShowManualModal,
    paymentRef,
    setPaymentRef,
    paymentMethod,
    setPaymentMethod,
    paymentDate,
    setPaymentDate,
    receiptFiles,
    setReceiptFiles,
    manualForm,
    setManualForm,
    recalcMut,
    approveMut,
    rejectMut,
    payMut,
    manualPayMut,
  }
}
