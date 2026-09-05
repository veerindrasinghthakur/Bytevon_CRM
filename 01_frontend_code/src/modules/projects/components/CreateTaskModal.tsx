import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { useCreateTask } from '../hooks/use-tasks'
import {CreateTaskModalProps,CreateTaskFormValues} from '../types'
import {createTaskSchema} from '../schemas/task-form'



export function CreateTaskModal({
  open,
  onClose,
  projectId,
  projectName,
  onCreated,
}: CreateTaskModalProps) {
  const create = useCreateTask()

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
    await create.mutateAsync({
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      priority: data.priority,
      projectId,
      projectName,
      assigneeName: data.assigneeName?.trim() || undefined,
    })
    reset()
    onCreated?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
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
              <label className="text-label-sm block mb-1">Title <span className="text-error">*</span></label>
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
              onChange={(v) => setValue('priority', v as CreateTaskFormValues['priority'], { shouldValidate: true })}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              minWidthClass="w-full"
            />
            <div>
              <label className="text-label-sm block mb-1">Assignee</label>
              <input
                {...register('assigneeName')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md focus:ring-2 focus:ring-secondary/30 outline-none"
                placeholder="Name"
              />
            </div>
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
