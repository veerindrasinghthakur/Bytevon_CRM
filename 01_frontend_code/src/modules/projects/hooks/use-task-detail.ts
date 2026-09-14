import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useState } from 'react'
import { useTask, useUpdateTask } from './use-tasks'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../enums'
import { taskDetailFormSchema, type TaskDetailFormInput } from '../schemas/task-detail-form'

export function useTaskDetail(taskId: number | undefined) {
  const query = useTask(taskId)
  const updateMutation = useUpdateTask()
  const task = query.data ?? null
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()
  const [saveError, setSaveError] = useState<string | null>(null)

  const form = useForm<TaskDetailFormInput>({
    resolver: zodResolver(taskDetailFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeName: '',
      dueDate: '',
    },
  })

  const startEditing = () => {
    if (!task) return
    setSaveError(null)
    form.reset({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      assigneeName: task.assigneeName ?? '',
      dueDate: task.dueDate ?? '',
    })
    setEditingTrue()
  }

  const cancelEdit = () => {
    setSaveError(null)
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        assigneeName: task.assigneeName ?? '',
        dueDate: task.dueDate ?? '',
      })
    }
    cancelEditing()
  }

  const save = async (extra?: { assigneeEmploymentId?: number | null }) => {
    if (!task) return
    setSaveError(null)
    const valid = await form.trigger()
    if (!valid) return
    const data = form.getValues()
    try {
      await updateMutation.mutateAsync({
        id: task.id,
        patch: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          assigneeName: data.assigneeName || undefined,
          dueDate: data.dueDate || null,
          ...(extra?.assigneeEmploymentId !== undefined
            ? { assigneeEmploymentId: extra.assigneeEmploymentId }
            : {}),
        },
      })
      finishEditing()
      void query.refetch()
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Could not save task'))
    }
  }

  return {
    task,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
    isEditing,
    form,
    startEditing,
    cancelEdit,
    save,
    isSaving: updateMutation.isPending,
    saveError,
    priorityOptions: [...TASK_PRIORITY_OPTIONS],
    statusOptions: [...TASK_STATUS_OPTIONS],
  }
}
