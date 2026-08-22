import { useEditMode } from '@/shared/hooks/useEditMode'
import { useTask, useUpdateTask } from './use-tasks'
import type { TaskPriority, TaskStatus } from '../types'

export interface TaskDetailDraft {
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assigneeName: string
  dueDate: string
}

export function useTaskDetail(taskId: number | undefined) {
  const query = useTask(taskId)
  const updateMutation = useUpdateTask()
  const task = query.data ?? null

  const edit = useEditMode<TaskDetailDraft>({
    initial: {
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
    edit.startEditing({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      assigneeName: task.assigneeName ?? '',
      dueDate: task.dueDate ?? '',
    })
  }

  const cancelEdit = () => {
    if (task) {
      edit.reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        assigneeName: task.assigneeName ?? '',
        dueDate: task.dueDate ?? '',
      })
    }
    edit.stopEditing()
  }

  const save = async () => {
    if (!task) return
    await updateMutation.mutateAsync({
      id: task.id,
      patch: {
        title: edit.draft.title,
        description: edit.draft.description,
        priority: edit.draft.priority,
        status: edit.draft.status,
        assigneeName: edit.draft.assigneeName || undefined,
        dueDate: edit.draft.dueDate || null,
      },
    })
    edit.stopEditing()
    void query.refetch()
  }

  return {
    task,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
    edit,
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
