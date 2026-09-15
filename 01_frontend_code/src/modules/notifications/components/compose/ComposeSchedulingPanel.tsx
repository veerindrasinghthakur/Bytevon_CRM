import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { ComposeNotificationForm } from '../../schemas/notification-form'

export function ComposeSchedulingPanel({
  register,
  scheduleMode,
  errors,
  defaultDate,
}: {
  register: UseFormRegister<ComposeNotificationForm>
  scheduleMode: string
  errors: FieldErrors<ComposeNotificationForm>
  defaultDate: string
}) {
  return (
    <section className="bv-surface p-6">
      <h3 className="text-title-lg font-semibold text-on-background mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">schedule</span> Scheduling
      </h3>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="radio" {...register('scheduleMode')} value="now" className="text-secondary" />
          <span className="text-label-md text-on-background font-medium">Send Immediately</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="radio" {...register('scheduleMode')} value="later" className="text-secondary" />
          <span className="text-label-md text-on-surface-variant">Schedule for later</span>
        </label>
        {scheduleMode === 'later' && (
          <div className="pl-7 pt-1">
            <label className="block text-label-sm text-on-surface-variant mb-1">Send at</label>
            <input
              type="datetime-local"
              {...register('scheduleAt')}
              defaultValue={`${defaultDate}T09:00`}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:border-secondary"
            />
            {errors.scheduleAt && (
              <p className="text-label-sm text-error mt-1">{errors.scheduleAt.message}</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
