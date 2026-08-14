import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leaveBalances } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const schema = z
  .object({
    type: z.enum(['Casual', 'Sick', 'Earned', 'Unpaid', 'Comp Off']),
    halfDay: z.boolean().optional(),
    from: z.string().min(1, 'Start date required'),
    to: z.string().min(1, 'End date required'),
    reason: z.string().min(10, 'Minimum 10 characters required').max(500),
  })
  .refine((data) => !data.from || !data.to || data.to >= data.from, {
    message: 'End date cannot be before start date',
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

export function ApplyLeavePage() {
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 7, 1))

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

  const isInRange = (day: number) => {
    if (!from || !to) return false
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return d >= from && d <= to
  }
  const isRangeStart = (day: number) => {
    if (!from) return false
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return d === from
  }
  const isRangeEnd = (day: number) => {
    if (!to) return false
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return d === to
  }

  const selectDay = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!from || (from && to)) {
      setValue('from', d, { shouldValidate: true })
      setValue('to', '', { shouldValidate: true })
    } else if (d >= from) {
      setValue('to', d, { shouldValidate: true })
    } else {
      setValue('from', d, { shouldValidate: true })
    }
  }

  return (
    <div className="relative space-y-6 pb-24">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
          <div className="bg-secondary text-white p-4 rounded-xl shadow-xl flex items-center gap-3 border border-secondary/20 animate-pulse">
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
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveBalances.map((lb) => (
          <div
            key={lb.type}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm hover:border-secondary/40 transition-colors group"
          >
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
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
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
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2 transition-colors"
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
                        'absolute top-[2px] left-[2px] size-5 bg-white rounded-full transition-transform shadow',
                        halfDay && 'translate-x-5'
                      )}
                    />
                  </div>
                  <span className="text-sm font-medium text-on-surface">Half Day Leave</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
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
                      {...register('from')}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
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
                      {...register('to')}
                      className={cn(
                        'w-full rounded-lg border bg-surface-container-lowest pl-10 pr-3 py-2.5 text-body-md text-on-surface outline-none focus:border-2',
                        errors.to
                          ? 'border-error focus:border-error'
                          : 'border-outline-variant focus:border-electric-blue'
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

              <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-lowest">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-label-md font-semibold text-on-surface">Visual Timeline Picker</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                      onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                    </button>
                    <span className="text-label-sm font-bold text-on-surface min-w-[120px] text-center">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                      onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    >
                      <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-on-surface-variant mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 text-center text-sm gap-y-0.5">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="py-2" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const inRange = isInRange(day)
                    const start = isRangeStart(day)
                    const end = isRangeEnd(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDay(day)}
                        className={cn(
                          'py-2 rounded-lg transition-colors',
                          start || end
                            ? 'bg-secondary text-white font-bold'
                            : inRange
                              ? 'bg-secondary/15 font-medium text-on-surface'
                              : 'hover:bg-surface-container text-on-surface'
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

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
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
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2 resize-y"
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
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
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

          <section className="bg-primary-container text-white rounded-xl p-6 relative overflow-hidden">
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

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
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
          <div className="bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
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
