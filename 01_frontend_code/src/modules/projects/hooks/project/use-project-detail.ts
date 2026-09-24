import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import type { EntityOption } from '@/shared/components/forms/EntitySearch'
import type { ActivityItem } from '@/shared/types'
import { listAuditLogs } from '@/modules/admin/api/audit'
import { useProject, useUpdateProject } from './use-projects'
import { useTasks } from '../task/use-tasks'
import { useDocuments, useUploadDocument } from '../document/use-documents'
import { getTeams } from '../../api/team'
import { getClientById } from '@/modules/sales/api/client'
import type { ProjectDetailTab } from '../../types'
import { TaskStatusFilterOptions } from '../../enums'
import { projectDetailFormSchema, type ProjectDetailFormInput } from '../../schemas/project/project-detail-form'

export function useProjectDetail(
  projectId: number | undefined,
  initialTab: ProjectDetailTab = 'overview',
) {
  const query = useProject(projectId)
  const updateMutation = useUpdateProject()
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()

  const project = query.data ?? null

  // Client name straight from the project payload; when the backend could
  // not resolve it, fall back to the live sales client record by client_id.
  const clientQuery = useQuery({
    queryKey: ['projects', 'client-name', project?.clientId],
    queryFn: () => getClientById(String(project?.clientId)),
    enabled: project != null && !project.clientName && project.clientId != null,
    staleTime: 60_000,
  })
  const enrichedProject = useMemo(
    () =>
      project
        ? { ...project, clientName: project.clientName ?? clientQuery.data?.name ?? null }
        : null,
    [project, clientQuery.data?.name],
  )

  const [tab, setTab] = useState<ProjectDetailTab>(
    initialTab,
  )
  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [changingTeam, setChangingTeam] = useState(false)
  const [teamAssignError, setTeamAssignError] = useState<string | null>(null)
  const [teamOptions, setTeamOptions] = useState<EntityOption[]>([])
  const [selectedTeam, setSelectedTeam] = useState<EntityOption | null>(null)

  const tasksQuery = useTasks(
    projectId != null && tab === 'tasks' ? { projectId } : undefined,
  )

  const {
    data: docsData,
    refetch: refetchDocs,
    isLoading: docsLoading,
  } = useDocuments({
    referenceType: 'PROJECT',
    referenceId: project?.id,
  })
  const uploadDoc = useUploadDocument({
    referenceType: 'PROJECT',
    referenceId: project?.id,
  })

  const activityQuery = useQuery({
    queryKey: ['projects', 'activity', project?.id],
    queryFn: () => listAuditLogs({ limit: 40 }),
    enabled: project?.id != null,
    staleTime: 30_000,
  })

  const form = useForm<ProjectDetailFormInput>({
    resolver: zodResolver(projectDetailFormSchema),
    defaultValues: {
      name: '',
      description: '',
      clientName: '',
      repositoryUrl: '',
      startDate: '',
      endDate: '',
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
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
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
        startDate: project.startDate ?? '',
        endDate: project.endDate ?? '',
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
          startDate: data.startDate || null,
          endDate: data.endDate || null,
        },
      })
      finishEditing()
      void query.refetch()
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Could not save project'))
    }
  }

  const assignTeam = async (teamId: number) => {
    if (!project) return
    setTeamAssignError(null)
    try {
      await updateMutation.mutateAsync({
        id: project.id,
        patch: {
          teamId,
          assignmentType: 'TEAM',
          assignedToId: teamId,
        },
      })
      setChangingTeam(false)
      void query.refetch()
    } catch (err) {
      setTeamAssignError(getApiErrorMessage(err, 'Could not assign team'))
    }
  }

  const loadTeams = async () => {
    try {
      const { items } = await getTeams({ pageSize: 100 })
      setTeamOptions(
        (items ?? []).map((t) => ({
          id: String(t.id),
          label: t.name,
          sublabel: t.headName ? `Head: ${t.headName}` : undefined,
        })),
      )
    } catch {
      setTeamOptions([])
    }
  }

  useEffect(() => {
    if (changingTeam) {
      void loadTeams()
      setSelectedTeam(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changingTeam])

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

  const activityItems: ActivityItem[] = useMemo(() => {
    const logs = activityQuery.data ?? []
    const pid = project?.id
    const pname = (project?.name ?? '').toLowerCase()
    const filtered = logs.filter((l) => {
      if (pid != null && l.referenceId === pid) return true
      const blob = `${l.description} ${l.target} ${l.referenceType} ${l.module}`.toLowerCase()
      if (pname && blob.includes(pname)) return true
      if (pid != null && blob.includes(`#${pid}`)) return true
      return false
    })
    const source = filtered.length > 0 ? filtered : logs.slice(0, 8)
    return source.slice(0, 12).map((l) => ({
      id: l.id,
      title: l.action.replace(/_/g, ' '),
      description: l.description || l.target,
      timestamp: l.timestamp,
      actor: l.actor,
      icon: l.action.includes('CREATE')
        ? 'add_circle'
        : l.action.includes('UPDATE') || l.action.includes('STATUS')
          ? 'edit'
          : l.action.includes('ASSIGN')
            ? 'group'
            : 'history',
    }))
  }, [activityQuery.data, project?.id, project?.name])

  const repoHref = project?.repositoryUrl
    ? project.repositoryUrl.startsWith('http')
      ? project.repositoryUrl
      : `https://github.com/${project.repositoryUrl}`
    : null

  const openTasks = enrichedProject?.openTasks ?? 0
  const progress = enrichedProject?.progress ?? 0
  const hasTeam = Boolean(enrichedProject?.teamName || enrichedProject?.teamId)

  // Days to deadline straight from the backend; when it is missing but the
  // project has a target end date, compute it locally with date-only math
  // (same rule as the backend: whole days from today to planned_end_date).
  const daysToDeadline = useMemo(() => {
    if (enrichedProject?.daysToDeadline != null) return enrichedProject.daysToDeadline
    const raw = (enrichedProject?.endDate ?? '').slice(0, 10)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
    if (!m) return null
    const end = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.round((end.getTime() - today.getTime()) / 86_400_000)
  }, [enrichedProject?.daysToDeadline, enrichedProject?.endDate])

  return {
    project: enrichedProject,
    isLoading: query.isLoading,
    isError: query.isError,
    detailError: query.error ?? null,
    refetch: () => {
      void query.refetch()
      if (tab === 'tasks') void tasksQuery.refetch()
      void refetchDocs()
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
    changingTeam,
    setChangingTeam,
    assignTeam,
    teamAssignError,
    isAssigningTeam: updateMutation.isPending,
    teamOptions,
    selectedTeam,
    setSelectedTeam,
    hasTeam,
    activityItems,
    repoHref,
    docsData,
    docsLoading,
    uploadDoc,
    refetchDocs,
  }
}


