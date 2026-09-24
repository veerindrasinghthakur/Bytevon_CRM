import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { invalidate, queryKeys } from '@/shared/lib/query-keys'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { myWorkRoutes } from '../../routes'
import {
  myTaskFormSchema,
  parseEstimatedHours,
  toBackendTaskPriority,
  type MyTaskFormValues,
  type MyTaskPriority,
} from '../../schemas/task-form'
import { createMyTask, listMyProjects } from '../../api/my-work'
import { toast } from '@/shared/hooks/use-toast'

const PRIORITIES: MyTaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export function MyTaskCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { employmentId } = useAuth()

  const projectsQuery = useQuery({
    queryKey: queryKeys.myWork.projects(),
    queryFn: listMyProjects,
  })
  const projects = projectsQuery.data ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MyTaskFormValues>({
    resolver: zodResolver(myTaskFormSchema),
    defaultValues: {
      name: '',
      projectId: 0,
      priority: 'MEDIUM',
      startDate: '',
      dueDate: '',
      estimatedHours: undefined,
      description: '',
    },
  })

  const priority = watch('priority')
  const projectId = watch('projectId')

  const createMut = useMutation({
    mutationFn: async (values: MyTaskFormValues) => {
      if (!values.projectId) throw new Error('Select a project')
      const estimated = parseEstimatedHours(values.estimatedHours)
      return createMyTask({
        projectId: values.projectId,
        title: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
        priority: toBackendTaskPriority(values.priority),
        startDate: values.startDate || null,
        dueDate: values.dueDate || null,
        estimatedHours: estimated,
      })
    },
    onSuccess: () => {
      void invalidate.myWorkTasks(qc)
      void invalidate.myWorkOverview(qc)
      toast.success('Task created and assigned to you')
      safeNavigate(navigate, { to: myWorkRoutes.tasks })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not create the task'))
    },
  })

  const onSubmit = (values: MyTaskFormValues) => {
    createMut.mutate(values)
  }

  const inputCls =
    'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors'

  return (
    <div className="space-y-6 max-w-xl animate-fade-in">
      <PageHeader title="Create task" description="Create a task in one of your projects — it is assigned to you." showBack />

      {projectsQuery.isError ? (
        <ErrorState
          title="Could not load your projects"
          description={getApiErrorMessage(projectsQuery.error, 'We could not load your active projects.')}
          onRetry={() => void projectsQuery.refetch()}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="bv-surface overflow-hidden">
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-label-md text-on-surface mb-1.5" htmlFor="name">
                Task name <span className="text-error">*</span>
              </label>
              <input
                id="name"
                {...register('name')}
                className={inputCls}
                placeholder="e.g. Review design specs"
              />
              {errors.name && <p className="mt-1 text-body-sm text-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1.5">
                Project <span className="text-error">*</span>
              </label>
              <Select
                value={projectId ? String(projectId) : ''}
                onChange={(v) => setValue('projectId', Number(v), { shouldValidate: true })}
                options={projects.map((p) => ({ value: String(p.id), label: p.name }))}
                placeholder={projectsQuery.isLoading ? 'Loading your projects…' : 'Select a project'}
                minWidthClass="w-full max-w-none"
                aria-label="Project"
              />
              {errors.projectId && (
                <p className="mt-1 text-body-sm text-error">{errors.projectId.message}</p>
              )}
              {!projectsQuery.isLoading && projects.length === 0 && (
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  No active projects assigned to you or your teams yet.
                </p>
              )}
            </div>

            <div>
              <span className="block text-label-md text-on-surface-variant mb-1.5">
                Assignee
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
                <span className="text-body-md text-on-surface">
                  Yourself{employmentId ? ` (Emp #${employmentId})` : ''}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1.5">Priority</label>
              <div className="flex bg-surface-container rounded-lg p-1 gap-1">
                {PRIORITIES.map((p) => (
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-on-surface mb-1.5" htmlFor="startDate">
                  Start date
                </label>
                <input id="startDate" type="date" {...register('startDate')} className={inputCls} />
              </div>
              <div>
                <label className="block text-label-md text-on-surface mb-1.5" htmlFor="dueDate">
                  Due date
                </label>
                <input id="dueDate" type="date" {...register('dueDate')} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1.5" htmlFor="estimatedHours">
                Estimated hours
              </label>
              <input
                id="estimatedHours"
                type="number"
                min={0}
                step={0.5}
                {...register('estimatedHours', { valueAsNumber: true })}
                className={inputCls}
                placeholder="e.g. 4"
              />
              {errors.estimatedHours && (
                <p className="mt-1 text-body-sm text-error">{errors.estimatedHours.message}</p>
              )}
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1.5" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className={`${inputCls} resize-y`}
                placeholder="Optional details"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => safeNavigate(navigate, { to: myWorkRoutes.tasks })}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending}>
              Create task
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
