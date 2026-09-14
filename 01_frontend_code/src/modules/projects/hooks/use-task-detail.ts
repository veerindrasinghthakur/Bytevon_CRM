import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import type { EntityOption } from '@/shared/components/forms/EntitySearch'
import { useTask, useUpdateTask } from './use-tasks'
import { useProject } from './use-projects'
import { getTeamMembers } from '../api/teams'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../enums'
import { taskDetailFormSchema, type TaskDetailFormInput } from '../schemas/task-detail-form'

export function useTaskDetail(taskId: number | undefined) {
  const query = useTask(taskId)
  const updateMutation = useUpdateTask()
  const task = query.data ?? null
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [assignee, setAssignee] = useState<EntityOption | null>(null)

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

  const projectQuery = useProject(
    task?.projectId != null && Number.isFinite(task.projectId) ? task.projectId : undefined,
  )
  const teamId = projectQuery.data?.teamId ?? null

  const membersQuery = useQuery({
    queryKey: ['projects', 'team-members-for-task-detail', teamId],
    queryFn: () => getTeamMembers(teamId!),
    enabled: isEditing && teamId != null && Number.isFinite(teamId),
    staleTime: 30_000,
  })

  const employeeOptions: EntityOption[] = useMemo(() => {
    const rows = membersQuery.data ?? []
    return rows
      .filter((m) => m.employmentId != null && Number(m.employmentId) > 0)
      .map((m) => ({
        id: Number(m.employmentId),
        label: m.name,
        sublabel: [m.role ?? m.title, m.email].filter(Boolean).join(' · '),
      }))
  }, [membersQuery.data])

  const startEditing = () => {
    if (!task) return
    setSaveError(null)
    form.reset({
      title: task.title || 'Task',
      description: task.description ?? '',
      priority: task.priority ?? 'MEDIUM',
      status: task.status ?? 'TODO',
      assigneeName: task.assigneeName ?? '',
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : '',
    })
    setEditingTrue()
  }

  const cancelEdit = () => {
    setSaveError(null)
    if (task) {
      form.reset({
        title: task.title || 'Task',
        description: task.description ?? '',
        priority: task.priority ?? 'MEDIUM',
        status: task.status ?? 'TODO',
        assigneeName: task.assigneeName ?? '',
        dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : '',
      })
    }
    cancelEditing()
  }

  useEffect(() => {
    if (!isEditing || !task) {
      setAssignee(null)
      return
    }
    if (task.assigneeEmploymentId != null) {
      setAssignee({
        id: task.assigneeEmploymentId,
        label: task.assigneeName ?? `Employment #${task.assigneeEmploymentId}`,
      })
    } else if (task.assigneeName) {
      setAssignee({ id: task.assigneeName, label: task.assigneeName })
    } else {
      setAssignee(null)
    }
  }, [isEditing, task?.id, task?.assigneeEmploymentId, task?.assigneeName])

  const save = async (extra?: {
    assigneeEmploymentId?: number | null
    assigneeName?: string
  }) => {
    if (!task) return
    setSaveError(null)
    const valid = await form.trigger()
    if (!valid) {
      const errs = form.formState.errors
      const first =
        errs.title?.message ||
        errs.description?.message ||
        errs.priority?.message ||
        errs.status?.message ||
        'Please fix the form errors before saving.'
      setSaveError(String(first))
      return
    }
    const data = form.getValues()
    const assigneeName =
      extra?.assigneeName?.trim() || data.assigneeName?.trim() || undefined
    try {
      await updateMutation.mutateAsync({
        id: task.id,
        patch: {
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          priority: data.priority,
          status: data.status,
          assigneeName,
          dueDate: data.dueDate || null,
          ...(extra?.assigneeEmploymentId !== undefined
            ? { assigneeEmploymentId: extra.assigneeEmploymentId }
            : task.assigneeEmploymentId != null
              ? { assigneeEmploymentId: task.assigneeEmploymentId }
              : {}),
        },
      })
      finishEditing()
      void query.refetch()
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Could not save task'))
    }
  }

  const saveWithAssignee = () => {
    const employmentId =
      assignee && typeof assignee.id === 'number'
        ? Number(assignee.id)
        : assignee && Number.isFinite(Number(assignee.id))
          ? Number(assignee.id)
          : null
    if (assignee?.label) {
      form.setValue('assigneeName', assignee.label)
    }
    void save({
      assigneeEmploymentId: employmentId,
      assigneeName: assignee?.label ?? form.getValues('assigneeName') ?? undefined,
    })
  }

  const needsTeam = isEditing && !projectQuery.isLoading && teamId == null

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
    saveWithAssignee,
    isSaving: updateMutation.isPending,
    saveError,
    priorityOptions: [...TASK_PRIORITY_OPTIONS],
    statusOptions: [...TASK_STATUS_OPTIONS],
    assignee,
    setAssignee,
    employeeOptions,
    membersQuery,
    teamId,
    needsTeam,
  }
}
