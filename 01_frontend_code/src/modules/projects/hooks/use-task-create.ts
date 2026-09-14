import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { EntityOption } from '@/shared/components/forms/EntitySearch'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { listEmployments } from '@/modules/workforce/api/employment'
import { useCreateTask } from './use-tasks'
import { useProject } from './use-projects'
import { projectRoutes } from '../routes'
import { schema } from '../schemas/task-form'

type FormValues = z.infer<typeof schema>

export function useTaskCreate() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { projectId?: string }
  const projectId = search.projectId ? Number(search.projectId) : undefined
  const { data: project } = useProject(
    projectId != null && Number.isFinite(projectId) ? projectId : undefined,
  )
  const [formError, setFormError] = useState<string | null>(null)

  const employeesQuery = useQuery({
    queryKey: ['workforce', 'employments', 'task-create-picker'],
    queryFn: () => listEmployments({ page: 1, pageSize: 300 }),
    staleTime: 60_000,
  })

  const employeeOptions: EntityOption[] = useMemo(() => {
    const items = employeesQuery.data?.items ?? []
    return items.map((e) => ({
      id: e.id,
      label: e.fullName || e.employee_code,
      sublabel: [e.employee_code, e.departmentName, e.positionName].filter(Boolean).join(' · '),
    }))
  }, [employeesQuery.data])

  const createMutation = useCreateTask()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', priority: 'MEDIUM', assignee: null },
  })

  const priority = form.watch('priority')
  const assignee = form.watch('assignee')

  const backTo =
    projectId != null && Number.isFinite(projectId)
      ? projectRoutes.projectDetail(projectId)
      : projectRoutes.tasks

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    if (!projectId || !Number.isFinite(projectId)) {
      setFormError('Open create-task from a project so projectId is set.')
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
      })
      safeNavigate(navigate, {
        to: projectRoutes.projectDetailPath,
        params: { projectId: String(projectId) },
        search: { tab: 'tasks' },
      })
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to create task. Please try again.'))
    }
  }

  const cancel = () => safeNavigate(navigate, { to: backTo })

  return {
    form,
    project,
    projectId,
    backTo,
    formError,
    employeeOptions,
    employeesQuery,
    createMutation,
    priority,
    assignee,
    setAssignee: (v: EntityOption | null) => form.setValue('assignee', v),
    setPriority: (p: FormValues['priority']) => form.setValue('priority', p),
    onSubmit: form.handleSubmit(onSubmit),
    cancel,
  }
}
