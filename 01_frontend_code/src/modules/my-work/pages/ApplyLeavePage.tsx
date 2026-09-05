import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { SaveDraftButton } from '@/shared/components/ui/SaveDraftButton'
import { DocumentUpload } from '@/shared/components/forms/DocumentUpload'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { cn } from '@/shared/lib/cn'
import { myWorkRoutes } from '../routes'
import { useApplyLeave } from '../hooks/use-apply-leave'
import type { LeaveFormValues } from '../types'

export function ApplyLeavePage() {
  const {
    leaveBalances,
    leaveTypeOptions,
    isContextLoading,
    isContextError,
    refetchContext,
    register,
    handleSubmit,
    setValue,
    errors,
    isSubmitting,
    from,
    to,
    halfDay,
    leaveType,
    onSubmit,
    dayCost,
    estimatedAfter,
    files,
    setFiles,
    showToast,
    setShowToast,
    handleSaveDraft,
    today,
    monthLabel,
    firstDay,
    cells,
    selectDay,
    prevMonth,
    nextMonth,
    goBackToLeave,
    submitPending,
    leaveTypeIcons,
  } = useApplyLeave()

  const fromReg = register('from')

  if (isContextError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Apply for Leave"
          description="Submit a leave request for manager approval."
          showBack
          backTo={myWorkRoutes.leave}
          backLabel="Back to My Leave"
        />
        <ErrorState
          title="Could not load leave context"
          description="Holidays, balances, and leave types failed to load."
          onRetry={refetchContext}
          onBack={goBackToLeave}
        />
      </div>
    )
  }

  return (
    <div className="relative space-y-6 pb-24 animate-fade-in">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
          <div className="bg-secondary text-on-secondary p-4 rounded-xl executive-shadow flex items-center gap-3">
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
        backTo={myWorkRoutes.leave}
        backLabel="Back to My Leave"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isContextLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bv-surface p-5 h-28 animate-pulse bg-surface-container-low" />
            ))
          : leaveBalances.map((lb) => (
              <div key={lb.type} className="bv-surface card-hover p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-surface-container-high text-secondary">
                    <span className="material-symbols-outlined text-xl">
                      {leaveTypeIcons[lb.type] ?? 'event'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {lb.remaining > 3 ? 'Healthy' : 'Low'}
                  </span>
                </div>
                <h3 className="text-label-md font-semibold text-on-surface">{lb.type} Leave</h3>
                <p className="text-2xl font-bold text-on-background mt-1">
                  {lb.remaining}{' '}
                  <span className="text-sm font-normal text-on-surface-variant">
                    / {lb.total} days remaining
                  </span>
                </p>
              </div>
            ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2 text-on-background">
                <span className="material-symbols-outlined text-secondary text-xl">info</span> Leave
                Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">
                  Leave Type <span className="text-error">*</span>
                </label>
                <Select
                  value={leaveType}
                  onChange={(v) =>
                    setValue('type', v as LeaveFormValues['type'], { shouldValidate: true })
                  }
                  options={leaveTypeOptions.map((o) => ({
                    value: String(o.name),
                    label: String(o.name),
                  }))}
                  aria-label="Leave type"
                />
              </div>
              <div className="flex flex-col justify-center">
                <label className="block text-label-md font-medium text-on-surface-variant mb-2">
                  Duration Modifier
                </label>
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
                        'absolute top-[2px] left-[2px] size-5 bg-surface-container-lowest rounded-full transition-transform',
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
                <span className="material-symbols-outlined text-secondary text-xl">event</span>{' '}
                Duration & Dates
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    className="block text-label-md font-medium text-on-surface-variant mb-1.5"
                    htmlFor="from"
                  >
                    Start Date *
                  </label>
                  <input
                    id="from"
                    type="date"
                    min={today}
                    {...fromReg}
                    onChange={(e) => {
                      fromReg.onChange(e)
                      if (to && e.target.value && to < e.target.value) {
                        setValue('to', '', { shouldValidate: true })
                      }
                    }}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md outline-none focus:border-secondary"
                  />
                  {errors.from && (
                    <p className="mt-1 text-body-sm text-error">{errors.from.message}</p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-label-md font-medium text-on-surface-variant mb-1.5"
                    htmlFor="to"
                  >
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
                Working days (excl. weekends/holidays):{' '}
                <strong className="text-on-surface">{dayCost}</strong>
              </p>
              <div className="border border-outline-variant rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label-md font-semibold text-on-surface">{monthLabel}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      onClick={prevMonth}
                      aria-label="Previous month"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      onClick={nextMonth}
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
                <div className="grid grid-cols-7 text-center text-sm">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e-${i}`} className="py-2" />
                  ))}
                  {cells.map(({ day, iso, dow, isHoliday }) => {
                    const isPast = iso < today
                    const inRange = Boolean(from && to && iso >= from && iso <= to)
                    const start = from === iso
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={isPast}
                        title={isHoliday ? 'Holiday' : undefined}
                        onClick={() => selectDay(iso)}
                        className={cn(
                          'py-2 rounded-lg',
                          isPast && 'opacity-35',
                          inRange || start
                            ? 'bg-secondary-container text-on-secondary-container font-semibold'
                            : isHoliday
                              ? 'bg-tertiary-container/40 text-on-surface'
                              : dow === 0 || dow === 6
                                ? 'bg-surface-container-low text-on-surface-variant'
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
            <label
              className="block text-label-md font-medium text-on-surface-variant mb-1.5"
              htmlFor="reason"
            >
              Reason *
            </label>
            <textarea
              id="reason"
              rows={4}
              {...register('reason')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md outline-none focus:border-secondary resize-y"
              placeholder="Describe the purpose of your leave request..."
            />
            {errors.reason && (
              <p className="mt-1 text-body-sm text-error">{errors.reason.message}</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h2 className="text-title-md font-semibold flex items-center gap-2 text-on-background">
                <span className="material-symbols-outlined text-secondary text-xl">attach_file</span>{' '}
                Supporting Docs
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
              <strong className="text-on-surface">{estimatedAfter} days</strong> · request{' '}
              {dayCost} day(s)
              {files.length > 0 && <> · {files.length} file(s)</>}
            </span>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={goBackToLeave}>
                Cancel
              </Button>
              <SaveDraftButton onClick={handleSaveDraft} />
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting || submitPending}
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
