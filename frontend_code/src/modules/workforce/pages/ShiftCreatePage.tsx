import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { canCreateShift } from '../data/shiftsMock'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'

const SHIFTS_LIST = '/workforce/shifts'

const shiftCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  start: z.string().min(1),
  end: z.string().min(1),
  breakMin: z.coerce.number().min(0),
  days: z.string().min(1),
})

type ShiftCreateInput = z.infer<typeof shiftCreateSchema>

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function ShiftCreatePage() {
  const navigate = useNavigate()
  const form = useForm<ShiftCreateInput>({
    resolver: zodResolver(shiftCreateSchema),
    defaultValues: {
      name: '',
      code: '',
      start: '09:00',
      end: '18:00',
      breakMin: 60,
      days: 'Mon–Fri',
    },
  })

  const goList = () => safeNavigate(navigate, { to: SHIFTS_LIST })

  if (!canCreateShift) {
    return (
      <div className="space-y-4 max-w-lg animate-fade-in">
        <BackButton to={SHIFTS_LIST} label="Back to shifts" />
        <div className="bv-surface p-8 text-center">
          <Icon name="lock" className="text-4xl text-on-surface-variant mb-3" />
          <h1 className="text-headline-md font-semibold">Permission required</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            You do not have permission to create shifts.
          </p>
          <Button className="mt-4" variant="primary" onClick={goList}>
            Back to shifts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <BackButton to={SHIFTS_LIST} label="Back to shifts" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: '/workforce/employees' },
            { label: 'Shifts', to: SHIFTS_LIST },
            { label: 'New shift' },
          ]}
        />
        <h1 className="text-headline-xl font-bold">Add Shift</h1>
        <p className="text-body-md text-on-surface-variant">Define schedule windows for workforce assignment.</p>
      </div>

      <form
        className="bv-surface p-6 space-y-4"
        onSubmit={form.handleSubmit(() => {
          goList()
        })}
      >
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Shift name</span>
          <input
            {...form.register('name')}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
            placeholder="General Day"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-error mt-1">{form.formState.errors.name.message}</p>
          )}
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Code</span>
          <input
            {...form.register('code')}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
            placeholder="SHIFT-DAY"
          />
          {form.formState.errors.code && (
            <p className="text-xs text-error mt-1">{form.formState.errors.code.message}</p>
          )}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">Start</span>
            <input
              type="time"
              {...form.register('start')}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            />
          </label>
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">End</span>
            <input
              type="time"
              {...form.register('end')}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            />
          </label>
        </div>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Break (minutes)</span>
          <input
            type="number"
            min={0}
            {...form.register('breakMin')}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
          />
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Working days</span>
          <input
            {...form.register('days')}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
          <Button type="button" variant="outline" onClick={goList}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create shift
          </Button>
        </div>
      </form>
    </div>
  )
}
