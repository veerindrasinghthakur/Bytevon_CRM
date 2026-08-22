import { useState } from 'react'
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

const empty: TaskDetailDraft = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  assigneeName: '',
  dueDate: '',
}

export function useTaskDetail(taskId: number | undefined) {
  const query = useTask(taskId)
  const updateMutation = useUpdateTask()
  const task = query.data ?? null
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()
  const [draft, setDraft] = useState<TaskDetailDraft>(empty)

  const startEditing = () => {
    if (!task) return
    setDraft({
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
      setDraft({
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
    await updateMutation.mutateAsync({
      id: task.id,
      patch: {
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        status: draft.status,
        assigneeName: draft.assigneeName || undefined,
        dueDate: draft.dueDate || null,
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
    draft,
    setDraft,
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
