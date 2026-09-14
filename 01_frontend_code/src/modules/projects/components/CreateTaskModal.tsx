import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { EntitySearch, type EntityOption } from '@/shared/components/forms/EntitySearch'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { listEmployments } from '@/modules/workforce/api/employment'
import { useCreateTask } from '../hooks/use-tasks'
import type { CreateTaskModalProps, CreateTaskFormValues } from '../types'
import { createTaskSchema } from '../schemas/task-form'

export function CreateTaskModal({
  open,
  onClose,
  projectId,
  projectName,
  onCreated,
}: CreateTaskModalProps) {
  const create = useCreateTask()
  const [assignee, setAssignee] = useState<EntityOption | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const employeesQuery = useQuery({
    queryKey: ['workforce', 'employments', 'task-assignee-picker'],
    queryFn: () => listEmployments({ page: 1, pageSize: 300 }),
    staleTime: 60_000,
    enabled: open,
  })

  const employeeOptions: EntityOption[] = useMemo(() => {
    const items = employeesQuery.data?.items ?? []
    return items.map((e) => ({
      id: e.id,
      label: e.fullName || e.employee_code,
      sublabel: [e.employee_code, e.departmentName, e.positionName].filter(Boolean).join(' · '),
    }))
  }, [employeesQuery.data])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeName: '',
    },
  })

  if (!open) return null

  const onSubmit = async (data: CreateTaskFormValues) => {
    setFormError(null)
    if (projectId == null) {
      setFormError('Project is required to create a task.')
      return
    }
    try {
      await create.mutateAsync({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority,
        projectId,
        projectName,
        assigneeName: assignee?.label ?? data.assigneeName?.trim() || undefined,
        assigneeEmploymentId: assignee ? Number(assignee.id) : null,
      } as Parameters<typeof create.mutateAsync>[0] & {
        assigneeEmploymentId?: number | null
      })
      reset()
      setAssignee(null)
      onCreated?.()
      onClose()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to create task.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 w-full max-w-lg bv-surface executive-shadow border border-outline-variant flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-title-lg font-semibold">Create task</h2>
            {projectName && (
              <p className="text-body-sm text-on-surface-variant">Project: {projectName}</p>
            )}
          </div>
          <button type="button" className="p-2 rounded-full hover:bg-surface-container" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-label-sm block mb-1">
                Title <span className="text-error">*</span>
              </label>
              <input
                {...register('title')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md focus:ring-2 focus:ring-secondary/30 outline-none"
                placeholder="Task title"
              />
              {errors.title && <p className="mt-1 text-body-sm text-error">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-label-sm block mb-1">Description</label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md resize-none focus:ring-2 focus:ring-secondary/30 outline-none"
              />
            </div>
            <Select
              label="Priority"
              value={watch('priority')}
              onChange={(v) =>
                setValue('priority', v as CreateTaskFormValues['priority'], { shouldValidate: true })
              }
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              minWidthClass="w-full"
            />
            <EntitySearch
              label="Assignee"
              placeholder={
                employeesQuery.isLoading
                  ? 'Loading employees…'
                  : 'Search employees by name, code, or department…'
              }
              options={employeeOptions}
              value={assignee}
              onChange={(opt) => {
                setAssignee(opt)
                setValue('assigneeName', opt?.label ?? '')
              }}
              disabled={employeesQuery.isLoading}
              emptyMessage={
                employeesQuery.isError ? 'Failed to load employees' : 'No employees match'
              }
            />
            {(formError || create.isError) && (
              <p className="text-body-sm text-error" role="alert">
                {formError ?? getApiErrorMessage(create.error, 'Failed to create task.')}
              </p>
            )}
          </div>
          <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || create.isPending}>
              Create task
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
