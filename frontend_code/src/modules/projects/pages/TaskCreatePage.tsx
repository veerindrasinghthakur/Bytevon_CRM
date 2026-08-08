import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useCreateTask } from '../hooks/use-tasks'

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

type FormValues = z.infer<typeof schema>

export function TaskCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateTask()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', priority: 'MEDIUM' },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data)
      navigate({ to: '/projects/tasks' })
    } catch {
      // shown below
    }
  }

  return (
    <div>
      <PageHeader
        title="New Task"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects/tasks" className="hover:text-electric-blue">Tasks</Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">New</span>
          </nav>
        }
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6"
      >
        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="title">
            Title <span className="text-error">*</span>
          </label>
          <input
            id="title"
            {...register('title')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            placeholder="Task title"
          />
          {errors.title && <p className="mt-1 text-body-sm text-error">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            {...register('priority')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2 resize-y"
            placeholder="Describe the task"
          />
        </div>

        {createMutation.isError && (
          <p className="text-body-sm text-error">Failed to create task. Please try again.</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting || createMutation.isPending}>
            Create Task
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/projects/tasks' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
