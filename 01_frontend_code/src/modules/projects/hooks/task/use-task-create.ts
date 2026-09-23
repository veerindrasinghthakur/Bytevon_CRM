import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { EntityOption } from '@/shared/components/forms/EntitySearch'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { getProjects } from '../../api/project'
import { getTeamMembers } from '../../api/team'
import { useCreateTask } from './use-tasks'
import { useProject } from '../project/use-projects'
import { projectRoutes } from '../../routes'
import { schema } from '../../schemas/task/task-form'

type FormValues = z.infer<typeof schema>

export function useTaskCreate() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { projectId?: string }
  const urlProjectId = search.projectId ? Number(search.projectId) : undefined
  const lockedProject = urlProjectId != null && Number.isFinite(urlProjectId)
  const [formError, setFormError] = useState<string | null>(null)

  // Standalone creation: all-projects picker (tasks can attach to any project).
  const projectsQuery = useQuery({
    queryKey: ['projects', 'list', 'all-picker'],
    queryFn: () => getProjects({ pageSize: 200 }),
    staleTime: 60_000,
  })

  const projectOptions = useMemo(() => {
    const items = projectsQuery.data?.items ?? []
    const opts = items.map((p) => ({ value: String(p.id), label: p.name }))
    if (lockedProject && !opts.some((o) => o.value === String(urlProjectId))) {
      opts.unshift({ value: String(urlProjectId), label: `Project #${urlProjectId}` })
    }
    return opts
  }, [projectsQuery.data, lockedProject, urlProjectId])

  const createMutation = useCreateTask()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      projectId: lockedProject ? urlProjectId : null,
      assignee: null,
      startDate: '',
      dueDate: '',
      estimatedHours: undefined,
    },
  })

  const priority = form.watch('priority')
  const assignee = form.watch('assignee')
  const pickedProjectId = form.watch('projectId')
  const projectId =
    pickedProjectId != null && Number.isFinite(Number(pickedProjectId))
      ? Number(pickedProjectId)
      : undefined
  const { data: project } = useProject(projectId)
  const teamId = project?.teamId ?? null

  // Assignees are restricted to members of the team assigned to the project.
  const membersQuery = useQuery({
    queryKey: ['projects', 'team-members-for-task-create', teamId],
    queryFn: () => getTeamMembers(teamId!),
    enabled: teamId != null && Number.isFinite(teamId),
    staleTime: 30_000,
  })

  // Drop a previously picked assignee when it is not on the new project team.
  useEffect(() => {
    const current = form.getValues('assignee')
    if (current == null || membersQuery.data == null) return
    const stillThere = membersQuery.data.some((m) => Number(m.employmentId) === Number(current.id))
    if (!stillThere) form.setValue('assignee', null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersQuery.data, projectId])

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

  const backTo =
    projectId != null && Number.isFinite(projectId)
      ? projectRoutes.projectDetail(projectId)
      : projectRoutes.tasks

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    if (projectId == null || !Number.isFinite(projectId)) {
      setFormError('Select a project for this task.')
      return
    }
    try {
      await createMutation.mutateAsync({
        title: data.title,
        description: data.description,
        priority: data.priority,
        projectId,
        projectName: project?.name,
        assigneeName: data.assignee?.label,
        assigneeEmploymentId: data.assignee ? Number(data.assignee.id) : null,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate || undefined,
        estimatedHours: data.estimatedHours ?? undefined,
      })
      if (lockedProject) {
        safeNavigate(navigate, {
          to: projectRoutes.projectDetailPath,
          params: { projectId: String(projectId) },
          search: { tab: 'tasks' },
        })
      } else {
        safeNavigate(navigate, { to: projectRoutes.tasks })
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to create task. Please try again.'))
    }
  }

  const cancel = () => safeNavigate(navigate, { to: backTo })

  return {
    form,
    project,
    projectId,
    lockedProject,
    projectOptions,
    projectsLoading: projectsQuery.isLoading,
    projectsError: projectsQuery.error,
    backTo,
    formError,
    employeeOptions,
    teamId,
    membersLoading: membersQuery.isLoading,
    membersError: membersQuery.error,
    createMutation,
    priority,
    assignee,
    setProjectId: (id: number | null) => form.setValue('projectId', id),
    setAssignee: (v: EntityOption | null) => form.setValue('assignee', v),
    setPriority: (p: FormValues['priority']) => form.setValue('priority', p),
    onSubmit: form.handleSubmit(onSubmit),
    cancel,
  }
}

