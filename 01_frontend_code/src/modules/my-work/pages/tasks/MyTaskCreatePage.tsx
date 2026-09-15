import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../../routes'
import { myTaskFormSchema, type MyTaskFormValues } from '../../schemas/task-form'

type FormValues = MyTaskFormValues

export function MyTaskCreatePage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(myTaskFormSchema),
    defaultValues: {
      name: '',
      project: '',
      priority: 'Medium',
      dueDate: '',
      estimatedHours: '',
      description: '',
    },
  })

  const priority = watch('priority')

  const onSubmit = async (_data: FormValues) => {
    await new Promise((r) => setTimeout(r, 500))
    safeNavigate(navigate, { to: myWorkRoutes.tasks })
  }

  return (
    <div className="space-y-6 max-w-xl animate-fade-in">
      <PageHeader title="Create task" description="Add a personal or assigned task to your list." showBack />

      <form onSubmit={handleSubmit(onSubmit)} className="bv-surface overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-label-md text-on-surface mb-1.5" htmlFor="name">
              Task name <span className="text-error">*</span>
            </label>
            <input
              id="name"
              {...register('name')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
              placeholder="e.g. Review design specs"
            />
            {errors.name && <p className="mt-1 text-body-sm text-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-label-md text-on-surface mb-1.5" htmlFor="project">
              Project (optional)
            </label>
            <input
              id="project"
              {...register('project')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
              placeholder="Project name"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface mb-1.5">Priority</label>
            <div className="flex bg-surface-container rounded-lg p-1 gap-1">
              {(['Low', 'Medium', 'High', 'Critical'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue('priority', p)}
                  className={`flex-1 py-1.5 px-2 rounded text-center text-label-sm font-medium transition-colors ${
                    priority === p
                      ? 'bg-surface-container-lowest text-secondary executive-shadow'
                      : 'text-on-surface-variant hover:bg-surface-container-lowest/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('priority')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface mb-1.5" htmlFor="dueDate">
                Due date
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-label-md text-on-surface mb-1.5" htmlFor="estimatedHours">
                Est. time
              </label>
              <input
                id="estimatedHours"
                {...register('estimatedHours')}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
                placeholder="e.g. 4h"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface mb-1.5" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors resize-y"
              placeholder="Optional details"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => safeNavigate(navigate, { to: myWorkRoutes.tasks })}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create task
          </Button>
        </div>
      </form>
    </div>
  )
}
