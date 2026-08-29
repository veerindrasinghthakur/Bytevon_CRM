import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { useTask, useUpdateTask } from './use-tasks'
import type { TaskPriority, TaskStatus } from '../types'
import { taskDetailFormSchema, type TaskDetailFormInput } from '../schemas/task-detail-form'

export function useTaskDetail(taskId: number | undefined) {
  const query = useTask(taskId)
  const updateMutation = useUpdateTask()
  const task = query.data ?? null
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()

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

  const save = async () => {
    if (!task) return
    const data = await form.handleSubmit(async (values) => values)()
    if (!data) return
    await updateMutation.mutateAsync({
      id: task.id,
      patch: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        assigneeName: data.assigneeName || undefined,
        dueDate: data.dueDate || null,
      },
    })
    finishEditing()
    void query.refetch()
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
    priorityOptions: [
      { value: 'LOW', label: 'Low' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'HIGH', label: 'High' },
      { value: 'URGENT', label: 'Urgent' },
    ],
    statusOptions: [
      { value: 'TODO', label: 'To do' },
      { value: 'IN_PROGRESS', label: 'In progress' },
      { value: 'IN_REVIEW', label: 'In review' },
      { value: 'DONE', label: 'Done' },
      { value: 'BLOCKED', label: 'Blocked' },
      { value: 'ON_HOLD', label: 'On hold' },
    ],
  }
}