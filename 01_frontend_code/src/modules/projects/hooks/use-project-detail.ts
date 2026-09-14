import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useProject, useUpdateProject } from './use-projects'
import { useTasks } from './use-tasks'
import { getTeam, getTeamsForProject, getTeamMembers } from '../api/teams'
import type { ProjectDetailTab } from '../types'
import { TaskStatusFilterOptions } from '../enums'
import { projectDetailFormSchema, type ProjectDetailFormInput } from '../schemas/project-detail-form'

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

  const linkedTeam = teamByIdQuery.data ?? teamsForProjectQuery.data?.[0] ?? null
  const linkedTeamId = linkedTeam?.id ?? null

  const membersQuery = useQuery({
    queryKey: ['projects', 'team-members', linkedTeamId],
    queryFn: () => getTeamMembers(linkedTeamId!),
    enabled: linkedTeamId != null && Number.isFinite(linkedTeamId),
  })

  const [tab, setTab] = useState<ProjectDetailTab>(initialTab)
  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
        errs.clientName?.message ||
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

  const openTasks = tasks.filter((t) => t.status !== 'DONE').length
  const progress = project?.progress ?? 0
  const daysToDeadline = project?.endDate
    ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000))
    : null

  const teamMembers = membersQuery.data ?? []
  const teamHead =
    teamMembers.find((m) => m.isHead || m.role === 'Lead' || m.role?.toLowerCase().includes('head')) ??
    (linkedTeam?.headName
      ? {
          id: 'head',
          name: linkedTeam.headName,
          title: linkedTeam.headRole ?? 'Team Head',
          role: 'Lead',
          email: '',
          status: 'Active',
          joined: '—',
          isHead: true,
        }
      : null)

  return {
    project,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch()
      void tasksQuery.refetch()
      void teamByIdQuery.refetch()
      void teamsForProjectQuery.refetch()
      void membersQuery.refetch()
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
    saveError,
    createTaskOpen,
    setCreateTaskOpen,
    linkedTeam,
    teamMembers,
    teamHead,
    teamMembersLoading: membersQuery.isLoading,
    taskStatusOptions: TaskStatusFilterOptions,
  }
}
