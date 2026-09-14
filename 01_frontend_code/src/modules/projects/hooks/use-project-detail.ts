import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useProject, useUpdateProject } from './use-projects'
import { useTasks } from './use-tasks'
import type { ProjectDetailTab } from '../types'
import { TaskStatusFilterOptions } from '../enums'
import { projectDetailFormSchema, type ProjectDetailFormInput } from '../schemas/project-detail-form'

export function useProjectDetail(
  projectId: number | undefined,
  initialTab: ProjectDetailTab = 'overview',
) {
  const query = useProject(projectId)
  const updateMutation = useUpdateProject()
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()

  const project = query.data ?? null

  const [tab, setTab] = useState<ProjectDetailTab>(
    initialTab === 'team' ? 'overview' : initialTab,
  )
  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Tasks: only fetch when Tasks tab is active (same API as task list + project_id filter)
  const tasksQuery = useTasks(
    projectId != null && tab === 'tasks' ? { projectId } : undefined,
  )

  const form = useForm<ProjectDetailFormInput>({
    resolver: zodResolver(projectDetailFormSchema),
    defaultValues: {
      name: '',
      description: '',
      clientName: '',
      repositoryUrl: '',
    },
  })

  const startEditing = () => {
    if (!project) return
    setSaveError(null)
    form.reset({
      name: project.name || 'Project',
      description: project.description ?? '',
      clientName: project.clientName ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
    })
    setEditingTrue()
  }

  const cancelEdit = () => {
    setSaveError(null)
    if (project) {
      form.reset({
        name: project.name || 'Project',
        description: project.description ?? '',
        clientName: project.clientName ?? '',
        repositoryUrl: project.repositoryUrl ?? '',
      })
    }
    cancelEditing()
  }

  const save = async () => {
    if (!project) return
    setSaveError(null)
    const valid = await form.trigger()
    if (!valid) {
      const errs = form.formState.errors
      const first =
        errs.name?.message ||
        errs.description?.message ||
        errs.repositoryUrl?.message ||
        'Please fix the form errors before saving.'
      setSaveError(String(first))
      return
    }
    const data = form.getValues()
    try {
      await updateMutation.mutateAsync({
        id: project.id,
        patch: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          repositoryUrl: data.repositoryUrl?.trim() || null,
        },
      })
      finishEditing()
      void query.refetch()
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Could not save project'))
    }
  }

  const tasks = tasksQuery.data?.items ?? []
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskStatusFilter && t.status !== taskStatusFilter) return false
      if (taskSearch) {
        const q = taskSearch.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !(t.assigneeName ?? '').toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [tasks, taskStatusFilter, taskSearch])

  // Metrics from single detail API (not a second tasks fetch)
  const openTasks = project?.openTasks ?? 0
  const progress = project?.progress ?? 0
  const daysToDeadline = project?.daysToDeadline ?? null

  return {
    project,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch()
      if (tab === 'tasks') void tasksQuery.refetch()
    },
    tab,
    setTab,
    tasks,
    tasksLoading: tab === 'tasks' && tasksQuery.isLoading,
    filteredTasks,
    taskStatusFilter,
    setTaskStatusFilter,
    taskSearch,
    setTaskSearch,
    openTasks,
    progress,
    daysToDeadline,
    isEditing,
    form,
    startEditing,
    save,
    cancelEdit,
    isSaving: updateMutation.isPending,
    saveError,
    createTaskOpen,
    setCreateTaskOpen,
    taskStatusOptions: TaskStatusFilterOptions,
  }
}
