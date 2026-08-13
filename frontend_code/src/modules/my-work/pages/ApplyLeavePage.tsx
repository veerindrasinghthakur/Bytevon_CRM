import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'

const schema = z.object({
  type: z.enum(['Casual', 'Sick', 'Earned', 'Unpaid', 'Comp Off']),
  from: z.string().min(1, 'Start date required'),
  to: z.string().min(1, 'End date required'),
  reason: z.string().min(3, 'Please provide a short reason').max(500),
})

type FormValues = z.infer<typeof schema>

export function ApplyLeavePage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Casual', from: '', to: '', reason: '' },
  })

  const onSubmit = async (_data: FormValues) => {
    await new Promise((r) => setTimeout(r, 500))
    navigate({ to: '/my-work/leave' })
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Apply for Leave"
        description="Submit a leave request for manager approval."
        showBack
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="type">
            Leave type <span className="text-error">*</span>
          </label>
          <select
            id="type"
            {...register('type')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
          >
            {['Casual', 'Sick', 'Earned', 'Unpaid', 'Comp Off'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-md text-on-surface mb-1.5" htmlFor="from">
              From <span className="text-error">*</span>
            </label>
            <input
              id="from"
              type="date"
              {...register('from')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            />
            {errors.from && <p className="mt-1 text-body-sm text-error">{errors.from.message}</p>}
          </div>
          <div>
            <label className="block text-label-md text-on-surface mb-1.5" htmlFor="to">
              To <span className="text-error">*</span>
            </label>
            <input
              id="to"
              type="date"
              {...register('to')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            />
            {errors.to && <p className="mt-1 text-body-sm text-error">{errors.to.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="reason">
            Reason <span className="text-error">*</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            {...register('reason')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2 resize-y"
            placeholder="Brief reason for leave"
          />
          {errors.reason && <p className="mt-1 text-body-sm text-error">{errors.reason.message}</p>}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Submit request
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/my-work/leave' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
