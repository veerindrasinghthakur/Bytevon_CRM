import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leaveBalances } from '../data/mock'
import { cn } from '@/shared/lib/cn'

/** Fixed holidays (YYYY-MM-DD) used across leave calendars */
export const HOLIDAYS_2026: Record<string, string> = {
  '2026-01-26': 'Republic Day',
  '2026-03-14': 'Holi',
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-20': 'Diwali',
  '2026-12-25': 'Christmas',
}

const schema = z
  .object({
    type: z.enum(['Casual', 'Sick', 'Earned', 'Unpaid', 'Comp Off']),
    halfDay: z.boolean().optional(),
    from: z.string().min(1, 'Start date required'),
    to: z.string().min(1, 'End date required'),
    reason: z.string().min(10, 'Minimum 10 characters required').max(500),
  })
  .refine((data) => !data.from || !data.to || data.to >= data.from, {
    message: 'End date must be on or after start date',
    path: ['to'],
  })

type FormValues = z.infer<typeof schema>

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

export function ApplyLeavePage() {
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)
  const today = useMemo(() => todayISO(), [])
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Casual',
      halfDay: false,
      from: '',
      to: '',
      reason: '',
    },
  })

  const from = watch('from')
  const to = watch('to')
  const halfDay = watch('halfDay')

  const onSubmit = async (_data: FormValues) => {
    await new Promise((r) => setTimeout(r, 600))
    navigate({ to: '/my-work/leave' })
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

  const isInRange = (iso: string) => {
    if (!from || !to) return false
    return iso >= from && iso <= to
  }
  const isRangeStart = (iso: string) => from === iso
  const isRangeEnd = (iso: string) => to === iso

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
          <div className="bg-secondary text-white p-4 rounded-xl executive-shadow flex items-center gap-3 border border-secondary/20">
            <span className="material-symbols-outlined">check_circle</span>
            <p className="text-sm font-medium flex-1">Draft saved successfully!</p>
            <button type="button" onClick={() => setShowToast(false)} className="opacity-80 hover:opacity-100">
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
          <div key={lb.type} className="bv-surface card-hover p-5 group">
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
            <div className="mt-3 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${(lb.used / lb.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2 text-on-background">
                <span className="material-symbols-outlined text-secondary text-xl">info</span>
                Leave Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-label-md font-medium text-on-surface-variant mb-1.5" htmlFor="type">
                  Leave Type <span className="text-error">*</span>
                </label>
                <select
                  id="type"
                  {...register('type')}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
                >
                  {(['Casual', 'Sick', 'Earned', 'Unpaid', 'Comp Off'] as const).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-center">
                <label className="block text-label-md font-medium text-on-surface-variant mb-2">
                  Duration Modifier
                </label>
                <label className="inline-flex items-center cursor-pointer gap-3">
                  <input type="checkbox" className="sr-only peer" {...register('halfDay')} />
                  <div
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      halfDay ? 'bg-secondary' : 'bg-outline-variant'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-[2px] left-[2px] size-5 bg-white rounded-full transition-transform executive-shadow',
                        halfDay && 'translate-x-5'
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
                <span className="material-symbols-outlined text-secondary text-xl">event</span>
                Duration & Dates
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-label-md font-medium text-on-surface-variant mb-1.5" htmlFor="from">
                    Start Date <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                      calendar_month
                    </span>
                    <input
                      id="from"
                      type="date"
                      min={today}
                      {...fromReg}
                      onChange={(e) => {
                        fromReg.onChange(e)
                        const v = e.target.value
                        if (v && v < today) {
                          setValue('from', '', { shouldValidate: true })
                          return
                        }
                        if (to && v && to < v) {
                          setValue('to', '', { shouldValidate: true })
                        }
                      }}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
                    />
                  </div>
                  {errors.from && <p className="mt-1 text-body-sm text-error">{errors.from.message}</p>}
                </div>
                <div>
                  <label className="block text-label-md font-medium text-on-surface-variant mb-1.5" htmlFor="to">
                    End Date <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span
                      className={cn(
                        'material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none',
                        errors.to ? 'text-error' : 'text-on-surface-variant'
                      )}
                    >
                      calendar_month
                    </span>
                    <input
                      id="to"
                      type="date"
                      min={from && from > today ? from : today}
                      {...register('to')}
                      className={cn(
                        'w-full rounded-lg border bg-surface-container-lowest pl-10 pr-3 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/30 transition-colors',
                        errors.to
                          ? 'border-error focus:border-error'
                          : 'border-outline-variant focus:border-secondary'
                      )}
                    />
                  </div>
                  {errors.to && (
                    <p className="mt-1 text-body-sm text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      {errors.to.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-label-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-sky-100 border border-sky-200" /> Selected leave range
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" /> Weekend
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-violet-100 border border-violet-200" /> Holiday
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200" /> Today
                </span>
              </div>

              <div className="border border-outline-variant rounded-xl p-4 bv-surface">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label-md font-semibold text-on-surface">Visual Timeline Picker</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                      onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                      aria-label="Previous month"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                    </button>
                    <span className="text-label-sm font-bold text-on-surface min-w-[130px] text-center">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                      onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                      aria-label="Next month"
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
                <div className="grid grid-cols-7 text-center text-sm gap-y-0.5">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="py-2" />
                  ))}
                  {cells.map(({ day, iso, dow }) => {
                    const isPast = iso < today
                    const isToday = iso === today
                    const weekend = dow === 0 || dow === 6
                    const holiday = HOLIDAYS_2026[iso]
                    const inRange = isInRange(iso)
                    const start = isRangeStart(iso)
                    const end = isRangeEnd(iso)
                    const singleDay = start && end

                    let rangeClass = ''
                    if (inRange || start || end) {
                      if (singleDay) {
                        rangeClass = 'bg-sky-100 text-on-surface font-semibold ring-1 ring-sky-300/60 rounded-lg'
                      } else if (start) {
                        rangeClass =
                          'bg-sky-100 text-on-surface font-semibold rounded-l-lg ring-1 ring-sky-200/80 ring-r-0'
                      } else if (end) {
                        rangeClass =
                          'bg-sky-100 text-on-surface font-semibold rounded-r-lg ring-1 ring-sky-200/80 ring-l-0'
                      } else {
                        rangeClass = 'bg-sky-50 text-on-surface'
                      }
                    }

                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={isPast}
                        title={
                          isPast
                            ? 'Past dates cannot be selected'
                            : holiday || (weekend ? 'Weekend' : isToday ? 'Today' : undefined)
                        }
                        onClick={() => selectDay(iso)}
                        className={cn(
                          'py-2 relative transition-colors',
                          isPast && 'opacity-35 cursor-not-allowed text-on-surface-variant',
                          !isPast && !inRange && !start && !end && 'hover:bg-surface-container rounded-lg',
                          !isPast && isToday && !inRange && !start && !end && 'bg-emerald-50 text-on-surface font-medium rounded-lg',
                          !isPast && holiday && !inRange && !start && !end && 'bg-violet-50 text-violet-800 font-medium rounded-lg',
                          !isPast && weekend && !holiday && !inRange && !start && !end && 'bg-slate-50 text-slate-500 rounded-lg',
                          rangeClass
                        )}
                      >
                        {day}
                        {holiday && !inRange && !start && !end && !isPast && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2 text-on-background">
                <span className="material-symbols-outlined text-secondary text-xl">notes</span>
                Leave Reason
              </h2>
            </div>
            <div className="p-6">
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5" htmlFor="reason">
                Reason for Leave <span className="text-error">*</span>
              </label>
              <textarea
                id="reason"
                rows={4}
                {...register('reason')}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 resize-y transition-colors"
                placeholder="Describe the purpose of your leave request..."
              />
              {errors.reason ? (
                <p className="mt-1 text-body-sm text-error">{errors.reason.message}</p>
              ) : (
                <p className="mt-1 text-xs text-on-surface-variant italic">Minimum 10 characters required.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2 text-on-background">
                <span className="material-symbols-outlined text-secondary text-xl">attach_file</span>
                Supporting Docs
              </h2>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center group hover:border-secondary transition-colors cursor-pointer bg-surface/50">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-secondary transition-colors mb-3">
                  cloud_upload
                </span>
                <p className="text-sm font-semibold text-on-surface">Drag and drop files</p>
                <p className="text-xs text-on-surface-variant mt-1">Or click to browse from device</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mt-3">
                  PDF, JPG up to 10MB
                </p>
              </div>
            </div>
          </section>

          <section className="bg-primary-container text-white rounded-xl p-6 relative overflow-hidden executive-shadow">
            <div className="relative z-10 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">Approval Workflow</h3>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Sarah Chen</p>
                  <p className="text-xs text-white/50">Direct Manager</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-white/70">
                Your request will be automatically routed to Sarah Chen for primary approval. Once approved, it will
                be reflected in the team calendar.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Standard SLA: 24 Hours
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 size-24 bg-white/5 rounded-full blur-2xl" />
          </section>

          <section className="bv-surface p-5">
            <h3 className="text-label-md font-semibold text-on-surface mb-3">Leave Policy Reminder</h3>
            <ul className="space-y-2.5">
              <li className="flex gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-sm shrink-0">check</span>
                <span>Requests over 5 days require 2 weeks notice.</span>
              </li>
              <li className="flex gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-sm shrink-0">check</span>
                <span>Sick leave over 2 days requires a certificate.</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="lg:col-span-3 sticky bottom-0 z-40 -mx-1 px-1">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 executive-shadow">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="text-xs font-medium">
                Estimated Balance after Approval:{' '}
                <span className="text-on-surface font-bold">
                  {Math.max(0, (leaveBalances[0]?.remaining ?? 6) - (halfDay ? 0.5 : 1))} days
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: '/my-work/leave' })}>
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
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
