import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { SaveDraftButton } from '@/shared/components/ui/SaveDraftButton'
import { DocumentUpload } from '@/shared/components/forms/DocumentUpload'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'

import {
  listLeaveTypeOptions,
  listMyLeaveBalances,
  submitLeaveRequest,
} from '../api/my-work'
import { emptyLeaveForm, leaveFormSchema, type LeaveFormValues } from '../types'

export const HOLIDAYS_2026: Record<string, string> = {
  '2026-01-26': 'Republic Day',
  '2026-03-14': 'Holi',
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-20': 'Diwali',
  '2026-12-25': 'Christmas',
}

const leaveTypeIcons: Record<string, string> = {
  Casual: 'sunny',
  Sick: 'medical_services',
  Earned: 'event_available',
  Unpaid: 'money_off',
  'Comp Off': 'swap_horiz',
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayISO() {
  const n = new Date()
  return toISO(n.getFullYear(), n.getMonth(), n.getDate())
}

function countLeaveDays(from: string, to: string, halfDay: boolean) {
  if (!from || !to) return halfDay ? 0.5 : 0
  const a = new Date(from + 'T12:00:00')
  const b = new Date(to + 'T12:00:00')
  let days = 0
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate())
    if (HOLIDAYS_2026[iso]) continue
    days += 1
  }
  if (halfDay && days >= 1) return Math.max(0.5, days - 0.5)
  return days
}

export function ApplyLeavePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [showToast, setShowToast] = useState(false)
  const today = useMemo(() => todayISO(), [])
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const balancesQuery = useQuery({
    queryKey: queryKeys.myWork.leave.balances(),
    queryFn: listMyLeaveBalances,
  })
  const typesQuery = useQuery({
    queryKey: [...queryKeys.myWork.leave.all, 'types'] as const,
    queryFn: listLeaveTypeOptions,
  })

  const leaveBalances = balancesQuery.data ?? []
  const leaveTypeOptions = typesQuery.data ?? []

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

  const submitMut = useMutation({
    mutationFn: submitLeaveRequest,
    onSuccess: () => {
      void invalidate.myWorkLeave(qc)
      safeNavigate(navigate,{ to: '/my-work/leave' })
    },
  })

  const from = watch('from')
  const to = watch('to')
  const halfDay = watch('halfDay')
  const leaveType = watch('type')
  const dayCost = countLeaveDays(from, to, Boolean(halfDay))
  const balanceForType = leaveBalances.find((b) => b.type === leaveType)

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

  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  const cells = useMemo(() => {
    const list: { day: number; iso: string; dow: number }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ day: d, iso: toISO(year, month, d), dow: new Date(year, month, d).getDay() })
    }
    return list
  }, [year, month, daysInMonth])

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

  const fromReg = register('from')

  return (
    <div className="relative space-y-6 pb-24 animate-fade-in">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
          <div className="bg-secondary text-white p-4 rounded-xl executive-shadow flex items-center gap-3">
            <span className="material-symbols-outlined">check_circle</span>
            <p className="text-sm font-medium flex-1">Draft saved successfully!</p>
            <button type="button" onClick={() => setShowToast(false)}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      <PageHeader
        title="Apply for Leave"
        description="Submit a leave request for manager approval."
        showBack
        backTo="/my-work/leave"
        backLabel="Back to My Leave"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveBalances.map((lb) => (
          <div key={lb.type} className="bv-surface card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-surface-container-high text-secondary">
                <span className="material-symbols-outlined text-xl">{leaveTypeIcons[lb.type] ?? 'event'}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {lb.remaining > 3 ? 'Healthy' : 'Low'}
              </span>
            </div>
            <h3 className="text-label-md font-semibold text-on-surface">{lb.type} Leave</h3>
            <p className="text-2xl font-bold text-on-background mt-1">
              {lb.remaining}{' '}
              <span className="text-sm font-normal text-on-surface-variant">/ {lb.total} days remaining</span>
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2 text-on-background">
                <span className="material-symbols-outlined text-secondary text-xl">info</span> Leave Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">
                  Leave Type <span className="text-error">*</span>
                </label>
                <Select
                  value={leaveType}
                  onChange={(v) => setValue('type', v as LeaveFormValues['type'], { shouldValidate: true })}
                  options={leaveTypeOptions.map((o) => ({ value: String(o.name), label: String(o.name) }))}
                />
              </div>
              <div className="flex flex-col justify-center">
                <label className="block text-label-md font-medium text-on-surface-variant mb-2">Duration Modifier</label>
                <label className="inline-flex items-center cursor-pointer gap-3">
                  <input type="checkbox" className="sr-only" {...register('halfDay')} />
                  <div
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      halfDay ? 'bg-secondary' : 'bg-outline-variant',
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-[2px] left-[2px] size-5 bg-white rounded-full transition-transform',
                        halfDay && 'translate-x-5',
                      )}
                    />
                  </div>
                  <span className="text-sm font-medium text-on-surface">Half Day Leave</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2 text-on-background">
                <span className="material-symbols-outlined text-secondary text-xl">event</span> Duration & Dates
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-label-md font-medium text-on-surface-variant mb-1.5" htmlFor="from">
                    Start Date *
                  </label>
                  <input
                    id="from"
                    type="date"
                    min={today}
                    {...fromReg}
                    onChange={(e) => {
                      fromReg.onChange(e)
                      if (to && e.target.value && to < e.target.value) setValue('to', '', { shouldValidate: true })
                    }}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md outline-none focus:border-secondary"
                  />
                  {errors.from && <p className="mt-1 text-body-sm text-error">{errors.from.message}</p>}
                </div>
                <div>
                  <label className="block text-label-md font-medium text-on-surface-variant mb-1.5" htmlFor="to">
                    End Date *
                  </label>
                  <input
                    id="to"
                    type="date"
                    min={from && from > today ? from : today}
                    {...register('to')}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md outline-none focus:border-secondary"
                  />
                  {errors.to && <p className="mt-1 text-body-sm text-error">{errors.to.message}</p>}
                </div>
              </div>
              <p className="text-label-sm text-on-surface-variant">
                Working days (excl. weekends/holidays): <strong className="text-on-surface">{dayCost}</strong>
              </p>
              <div className="border border-outline-variant rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label-md font-semibold">{monthLabel}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    >
                      <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-on-surface-variant mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={`${d}-${i}`}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 text-center text-sm">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e-${i}`} className="py-2" />
                  ))}
                  {cells.map(({ day, iso, dow }) => {
                    const isPast = iso < today
                    const inRange = from && to && iso >= from && iso <= to
                    const start = from === iso
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={isPast}
                        onClick={() => selectDay(iso)}
                        className={cn(
                          'py-2 rounded-lg',
                          isPast && 'opacity-35',
                          inRange || start
                            ? 'bg-sky-100 font-semibold'
                            : dow === 0 || dow === 6
                              ? 'bg-slate-50'
                              : 'hover:bg-surface-container',
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="bv-surface p-6">
            <label className="block text-label-md font-medium text-on-surface-variant mb-1.5" htmlFor="reason">
              Reason *
            </label>
            <textarea
              id="reason"
              rows={4}
              {...register('reason')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md outline-none focus:border-secondary resize-y"
              placeholder="Describe the purpose of your leave request..."
            />
            {errors.reason && <p className="mt-1 text-body-sm text-error">{errors.reason.message}</p>}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">attach_file</span> Supporting Docs
              </h2>
            </div>
            <div className="p-6">
              <DocumentUpload
                files={files}
                onChange={setFiles}
                accept=".pdf,.jpg,.jpeg,.png"
                title="Upload supporting documents"
                hint="PDF, JPG, PNG"
              />
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 sticky bottom-0 z-40">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 executive-shadow">
            <span className="text-xs text-on-surface-variant">
              Est. balance after:{' '}
              <strong className="text-on-surface">
                {Math.max(0, (balanceForType?.remaining ?? 0) - dayCost)} days
              </strong>{' '}
              · request {dayCost} day(s)
              {files.length > 0 && <> · {files.length} file(s)</>}
            </span>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => safeNavigate(navigate,{ to: '/my-work/leave' })}>
                Cancel
              </Button>
              <SaveDraftButton onClick={handleSaveDraft} />
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting || submitMut.isPending}
                rightIcon={<span className="material-symbols-outlined text-sm">send</span>}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
