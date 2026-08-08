import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { useCreateTask } from '../hooks/use-tasks'

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

type FormValues = z.infer<typeof schema>

/**
 * Create Task — structure from 04_projects/create_new_task_refreshed_bytevon_crm.html
 * Sections: Task Identity, Assignment & Timeline, Additional Details (priority).
 */
export function TaskCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateTask()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', priority: 'MEDIUM' },
  })

  const priority = watch('priority')

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data)
      navigate({ to: '/projects/tasks' })
    } catch {
      // shown below
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-electric-blue/10 flex items-center justify-center text-electric-blue">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                add_task
              </span>
            </div>
            <div>
              <h2 className="text-headline-md font-bold text-on-surface">Create Task</h2>
              <p className="text-body-md text-on-surface-variant">Define a new actionable item for your team</p>
            </div>
          </div>
          <Link
            to="/projects/tasks"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-6 bg-background">
            {/* Task Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="material-symbols-outlined text-electric-blue text-sm">assignment</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Task Identity
                </h3>
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1" htmlFor="title">
                  Task Name
                </label>
                <input
                  id="title"
                  {...register('title')}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-lg text-on-surface focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue"
                  placeholder="e.g., Finalize Q3 Marketing Report"
                />
                {errors.title && <p className="mt-1 text-body-sm text-error">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  {...register('description')}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue resize-none"
                  placeholder="Provide detailed instructions or context..."
                />
              </div>
            </div>

            {/* Additional Details – Priority segmented control */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="material-symbols-outlined text-electric-blue text-sm">tune</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Additional Details
                </h3>
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Priority</label>
                <div className="flex bg-surface-container rounded-lg p-1">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValue('priority', p)}
                      className={`flex-1 py-1.5 px-3 rounded text-center text-body-md font-medium transition-colors ${
                        priority === p
                          ? 'bg-surface text-electric-blue shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface/50'
                      }`}
                    >
                      {p === 'LOW' && 'Low'}
                      {p === 'MEDIUM' && 'Medium'}
                      {p === 'HIGH' && (
                        <span className="inline-flex items-center justify-center gap-1">
                          High{' '}
                          <span className="material-symbols-outlined text-sm text-error">local_fire_department</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('priority')} />
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-body-sm text-error">Failed to create task. Please try again.</p>
            )}
          </div>

          <div className="p-5 border-t border-outline-variant bg-surface flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate({ to: '/projects/tasks' })}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || createMutation.isPending}
              leftIcon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
            >
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
