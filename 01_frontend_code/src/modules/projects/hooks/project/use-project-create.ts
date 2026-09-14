import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import type { EntityOption } from '@/shared/components/forms/EntitySearch'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { createProjectSchema, type CreateProjectInput } from '../../schemas/project/project'
import { useCreateProject } from './use-projects'
import { useTeams } from '../team/use-teams'
import { projectRoutes } from '../../routes'
import { listClients } from '@/modules/sales/api/sales'
import { listEmployments } from '@/modules/workforce/api/employment'
import { ProjectPhaseOptions, ProjectPriorityOptions } from '../../enums'
import type { AssignMode, PhaseValue, PriorityValue } from '../../types'

export function useProjectCreate() {
  const navigate = useNavigate()
  const createMutation = useCreateProject()
  const { data: teamsData, isLoading: teamsLoading } = useTeams()

  const clientsQuery = useQuery({
    queryKey: ['sales', 'clients', 'picker', { status: 'Active' }],
    queryFn: () => listClients({ status: 'Active', page: 1, pageSize: 200 }),
    staleTime: 60_000,
  })

  const employeesQuery = useQuery({
    queryKey: ['workforce', 'employments', 'picker'],
    queryFn: () => listEmployments({ page: 1, pageSize: 200 }),
    staleTime: 60_000,
  })

  const [assignMode, setAssignMode] = useState<AssignMode>('later')
  const [selectedClient, setSelectedClient] = useState<EntityOption | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<EntityOption | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EntityOption | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [phase, setPhase] = useState<PhaseValue>(ProjectPhaseOptions[0]?.value ?? 'DISCOVERY')
  const [priority, setPriority] = useState<PriorityValue>(
    ProjectPriorityOptions[1]?.value ?? 'MEDIUM',
  )

  const clientOptions: EntityOption[] = useMemo(() => {
    const items = clientsQuery.data?.items ?? []
    return items
      .filter((c) => (c.status ?? 'Active') !== 'Inactive')
      .map((c) => ({
        id: Number.isFinite(Number(c.id)) ? Number(c.id) : c.id,
        label: c.name,
        sublabel: [c.industry, c.country, c.type].filter(Boolean).join(' -+ '),
      }))
  }, [clientsQuery.data])

  const teamOptions: EntityOption[] = useMemo(
    () =>
      (teamsData?.items ?? []).map((t) => ({
        id: t.id,
        label: t.name,
        sublabel: [
          t.department,
          t.headName ? `Head: ${t.headName}` : null,
          `${t.memberCount} members`,
        ]
          .filter(Boolean)
          .join(' -+ '),
      })),
    [teamsData],
  )

  const employeeOptions: EntityOption[] = useMemo(() => {
    const items = employeesQuery.data?.items ?? []
    return items.map((e) => ({
      id: e.id,
      label: e.fullName || e.employee_code,
      sublabel: [e.employee_code, e.departmentName, e.positionName].filter(Boolean).join(' -+ '),
    }))
  }, [employeesQuery.data])

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      clientName: '',
      repositoryUrl: '',
    },
  })

  const goProject = (id: number) =>
    safeNavigate(navigate, {
      to: projectRoutes.projectDetailPath,
      params: { projectId: String(id) },
    })

  const onSubmit = async (data: CreateProjectInput) => {
    setFormError(null)

    if (!selectedClient) {
      setFormError('Select a client from the list.')
      return
    }
    const clientId = Number(selectedClient.id)
    if (!Number.isFinite(clientId) || clientId <= 0) {
      setFormError('Selected client is invalid.')
      return
    }

    if (assignMode === 'existing' && !selectedTeam) {
      setFormError('Select a team to assign.')
      return
    }
    if (assignMode === 'Individual' && !selectedEmployee) {
      setFormError('Select an employee to assign.')
      return
    }

    const payload: CreateProjectInput = {
      ...data,
      clientId,
      clientName: selectedClient.label,
      teamId: assignMode === 'existing' && selectedTeam ? Number(selectedTeam.id) : null,
      assignedEmploymentId:
        assignMode === 'Individual' && selectedEmployee ? Number(selectedEmployee.id) : null,
      assignmentType:
        assignMode === 'existing'
          ? 'TEAM'
          : assignMode === 'Individual'
            ? 'INDIVIDUAL'
            : 'INDIVIDUAL',
    }

    if (assignMode === 'later' || assignMode === 'new') {
      const fallbackEmp = employeeOptions[0]
      if (!payload.assignedEmploymentId && fallbackEmp) {
        payload.assignedEmploymentId = Number(fallbackEmp.id)
      }
      if (!payload.assignedEmploymentId) {
        setFormError('No employees available to hold temporary assignment. Add an employee first.')
        return
      }
    }

    try {
      const project = await createMutation.mutateAsync(payload)

      if (assignMode === 'new') {
        safeNavigate(navigate, {
          to: projectRoutes.teamNew,
          search: {
            projectId: String(project.id),
            returnTo: projectRoutes.projectDetail(project.id),
          },
        })
        return
      }

      goProject(project.id)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to create project. Please try again.'))
    }
  }

  const cancel = () => safeNavigate(navigate, { to: projectRoutes.list })

  const setAssignModeSafe = (mode: AssignMode) => {
    setAssignMode(mode)
    setFormError(null)
  }

  return {
    form,
    assignMode,
    setAssignMode: setAssignModeSafe,
    selectedClient,
    setSelectedClient,
    selectedTeam,
    setSelectedTeam,
    selectedEmployee,
    setSelectedEmployee,
    formError,
    phase,
    setPhase,
    priority,
    setPriority,
    clientOptions,
    teamOptions,
    employeeOptions,
    teamsLoading,
    clientsQuery,
    employeesQuery,
    createMutation,
    onSubmit: form.handleSubmit(onSubmit),
    cancel,
  }
}

