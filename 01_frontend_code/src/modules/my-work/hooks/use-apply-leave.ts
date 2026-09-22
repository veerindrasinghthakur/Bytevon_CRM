/**
 * Apply Leave page hook — form, calendar, context + day-cost from API.
 * Page component stays presentational.
 */
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import {
  calculateLeaveDays,
  getApplyLeaveContext,
  submitLeaveRequest,
} from '../api/my-work'
import { myWorkRoutes } from '../routes'
import { emptyLeaveForm, leaveFormSchema, type LeaveFormValues } from '../types'

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayISO() {
  const n = new Date()
  return toISO(n.getFullYear(), n.getMonth(), n.getDate())
}

export const leaveTypeIcons: Record<string, string> = {
  CASUAL: 'sunny',
  SICK: 'medical_services',
  EARNED: 'event_available',
  LOSS_OF_PAY: 'money_off',
  COMP_OFF: 'swap_horiz',
  MATERNITY: 'child_care',
  PATERNITY: 'family_restroom',
  // Legacy display-label keys (back-compat for old cached contexts).
  Casual: 'sunny',
  Sick: 'medical_services',
  Earned: 'event_available',
  Unpaid: 'money_off',
  'Comp Off': 'swap_horiz',
}

export function useApplyLeave() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [showToast, setShowToast] = useState(false)
  const today = useMemo(() => todayISO(), [])
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const contextQuery = useQuery({
    queryKey: queryKeys.myWork.leave.applyContext(),
    queryFn: getApplyLeaveContext,
  })

  const leaveBalances = contextQuery.data?.balances ?? []
  const leaveTypeOptions = contextQuery.data?.leaveTypes ?? []
  const holidays = contextQuery.data?.holidays ?? []
  const holidayMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const h of holidays) m[h.date] = h.name
    return m
  }, [holidays])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: emptyLeaveForm(),
  })

  const from = watch('from')
  const to = watch('to')
  const halfDay = watch('halfDay')
  const leaveType = watch('type')

  const canCalculate = Boolean(from && to && leaveType)

  const calculateQuery = useQuery({
    queryKey: queryKeys.myWork.leave.calculate({
      type: leaveType,
      from,
      to,
      halfDay: Boolean(halfDay),
    }),
    queryFn: () =>
      calculateLeaveDays({
        type: leaveType,
        from,
        to,
        halfDay: Boolean(halfDay),
      }),
    enabled: canCalculate,
    placeholderData: (prev) => prev,
  })

  const dayCost = canCalculate ? (calculateQuery.data?.dayCost ?? 0) : 0
  const balanceForType = leaveBalances.find((b) => b.type === leaveType)
  const estimatedAfter =
    calculateQuery.data?.estimatedBalanceAfter ??
    Math.max(0, (balanceForType?.remaining ?? 0) - dayCost)

  const submitMut = useMutation({
    mutationFn: submitLeaveRequest,
    onSuccess: () => {
      void invalidate.myWorkLeave(qc)
      safeNavigate(navigate, { to: myWorkRoutes.leave })
    },
  })

  const onSubmit = async (data: LeaveFormValues) => {
    void files
    await submitMut.mutateAsync({
      type: data.type,
      from: data.from,
      to: data.to,
      reason: data.reason,
      halfDay: data.halfDay,
    })
  }

  const handleSaveDraft = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  const goBackToLeave = useCallback(() => {
    safeNavigate(navigate, { to: myWorkRoutes.leave })
  }, [navigate])

  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  const cells = useMemo(() => {
    const list: { day: number; iso: string; dow: number; isHoliday: boolean }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(year, month, d)
      list.push({
        day: d,
        iso,
        dow: new Date(year, month, d).getDay(),
        isHoliday: Boolean(holidayMap[iso]),
      })
    }
    return list
  }, [year, month, daysInMonth, holidayMap])

  const selectDay = (iso: string) => {
    if (iso < today) return
    if (!from || (from && to)) {
      setValue('from', iso, { shouldValidate: true })
      setValue('to', '', { shouldValidate: true })
    } else if (iso >= from) {
      setValue('to', iso, { shouldValidate: true })
    } else {
      setValue('from', iso, { shouldValidate: true })
      setValue('to', from, { shouldValidate: true })
    }
  }

  const prevMonth = () => setCalendarMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCalendarMonth(new Date(year, month + 1, 1))

  return {
    // context
    leaveBalances,
    leaveTypeOptions,
    holidayMap,
    isContextLoading: contextQuery.isLoading,
    isContextError: contextQuery.isError,
    refetchContext: () => void contextQuery.refetch(),

    // form
    register,
    handleSubmit,
    setValue,
    errors,
    isSubmitting,
    from,
    to,
    halfDay: Boolean(halfDay),
    leaveType,
    onSubmit,

    // calculated (from API)
    dayCost,
    estimatedAfter,
    balanceForType,
    isCalculating: calculateQuery.isFetching,

    // files / draft toast
    files,
    setFiles,
    showToast,
    setShowToast,
    handleSaveDraft,

    // calendar
    today,
    calendarMonth,
    monthLabel,
    firstDay,
    cells,
    selectDay,
    prevMonth,
    nextMonth,

    // navigation / mutation
    goBackToLeave,
    submitPending: submitMut.isPending,
    leaveTypeIcons,
  }
}
