import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { useProject, useUpdateProject } from './use-projects'
import { useTasks } from './use-tasks'
import { getTeam, getTeamsForProject } from '../api/teams'
import { auditLogs } from '@/modules/admin/data/mock'
import type { ProjectDetailTab } from '../types'
import { TaskStatusFilterOptions } from '../enums'
import { projectDetailFormSchema, type ProjectDetailFormInput } from '../schemas/project-detail-form'

function activityFromAudit(projectName?: string) {
  const logs = auditLogs.slice(0, 8)
  return logs.map((log) => ({
    id: log.id,
    title: log.action,
    description: `${log.actor} · ${log.target}${projectName ? ` · ${projectName}` : ''}`,
    timestamp: log.timestamp,
    icon:
      log.action.toLowerCase().includes('lock')
        ? 'lock'
        : log.action.toLowerCase().includes('permission')
          ? 'key'
          : log.action.toLowerCase().includes('setting')
            ? 'settings'
            : 'history',
  }))
}

export function useProjectDetail(
  projectId: number | undefined,
  initialTab: ProjectDetailTab = 'overview',
) {
  const query = useProject(projectId)
  const tasksQuery = useTasks(projectId != null ? { projectId } : undefined)
  const updateMutation = useUpdateProject()
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()

  const project = query.data ?? null
  const teamIdFromProject = project?.teamId ?? null

  const teamByIdQuery = useQuery({
    queryKey: ['projects', 'team-by-id', teamIdFromProject],
    queryFn: () => getTeam(teamIdFromProject!),
    enabled: teamIdFromProject != null && Number.isFinite(teamIdFromProject),
  })

  const teamsForProjectQuery = useQuery({
    queryKey: ['projects', 'teams-for-project', projectId],
    queryFn: () => getTeamsForProject(projectId!),
    enabled:
      projectId != null &&
      Number.isFinite(projectId) &&
      (teamIdFromProject == null || teamByIdQuery.isError),
  })

  const [tab, setTab] = useState<ProjectDetailTab>(initialTab)
  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  const form = useForm<ProjectDetailFormInput>({
    resolver: zodResolver(projectDetailFormSchema),
    defaultValues: {
      name: '',
      description: '',
      clientName: '',
      repositoryUrl: '',
    },
  })

  const linkedTeam =
    teamByIdQuery.data ?? teamsForProjectQuery.data?.[0] ?? null
  const activityItems = useMemo(
    () => activityFromAudit(project?.name),
    [project?.name],
  )

  const startEditing = () => {
    if (!project) return
    form.reset({
      name: project.name,
      description: project.description ?? '',
      clientName: project.clientName ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
    })
    setEditingTrue()
  }

  const cancelEdit = () => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? '',
        clientName: project.clientName ?? '',
        repositoryUrl: project.repositoryUrl ?? '',
      })
    }
    cancelEditing()
  }

  const save = async () => {
    if (!project) return
    const data = await form.handleSubmit(async (values) => values)()
    if (!data) return
    await updateMutation.mutateAsync({
      id: project.id,
      patch: {
        name: data.name,
        description: data.description,
        clientName: data.clientName,
        repositoryUrl: data.repositoryUrl || null,
      },
    })
    finishEditing()
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

  const openTasks = tasks.filter((t) => t.status !== 'DONE').length
  const progress = project?.progress ?? 0
  const daysToDeadline = project?.endDate
    ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000))
    : null

  return {
    project,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch()
      void tasksQuery.refetch()
      void teamByIdQuery.refetch()
      void teamsForProjectQuery.refetch()
    },
    tab,
    setTab,
    tasks,
    tasksLoading: tasksQuery.isLoading,
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
    createTaskOpen,
    setCreateTaskOpen,
    linkedTeam,
    activityItems,
    taskStatusOptions: TaskStatusFilterOptions,
  }
}
