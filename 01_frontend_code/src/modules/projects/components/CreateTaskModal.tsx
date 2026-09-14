import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { EntitySearch, type EntityOption } from '@/shared/components/forms/EntitySearch'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useCreateTask } from '../hooks/use-tasks'
import { useProject } from '../hooks/use-projects'
import { getTeamMembers } from '../api/teams'
import { projectRoutes } from '../routes'
import type { CreateTaskModalProps, CreateTaskFormValues } from '../types'
import { createTaskSchema } from '../schemas/task-form'

export function CreateTaskModal({
  open,
  onClose,
  projectId,
  projectName,
  onCreated,
}: CreateTaskModalProps) {
  const navigate = useNavigate()
  const create = useCreateTask()
  const [assignee, setAssignee] = useState<EntityOption | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const projectQuery = useProject(
    open && projectId != null && Number.isFinite(projectId) ? projectId : undefined,
  )
  const teamId = projectQuery.data?.teamId ?? null

  const membersQuery = useQuery({
    queryKey: ['projects', 'team-members-for-task', teamId],
    queryFn: () => getTeamMembers(teamId!),
    enabled: open && teamId != null && Number.isFinite(teamId),
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeName: '',
    },
  })

  if (!open) return null

  const needsTeam = projectId != null && !projectQuery.isLoading && teamId == null

  const onSubmit = async (data: CreateTaskFormValues) => {
    setFormError(null)
    if (projectId == null) {
      setFormError('Project is required to create a task.')
      return
    }
    if (needsTeam) {
      setFormError('Assign a team to this project before creating tasks with an assignee.')
      return
    }
    try {
      const assigneeName =
        assignee?.label ?? (data.assigneeName?.trim() || undefined)
      await create.mutateAsync({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority,
        projectId,
        projectName,
        assigneeName,
        assigneeEmploymentId: assignee ? Number(assignee.id) : null,
      })
      reset()
      setAssignee(null)
      onCreated?.()
      onClose()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to create task.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 w-full max-w-lg bv-surface executive-shadow border border-outline-variant flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-title-lg font-semibold">Create task</h2>
            {projectName && (
              <p className="text-body-sm text-on-surface-variant">Project: {projectName}</p>
            )}
          </div>
          <button type="button" className="p-2 rounded-full hover:bg-surface-container" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-label-sm block mb-1">
                Title <span className="text-error">*</span>
              </label>
              <input
                {...register('title')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md focus:ring-2 focus:ring-secondary/30 outline-none"
                placeholder="Task title"
              />
              {errors.title && <p className="mt-1 text-body-sm text-error">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-label-sm block mb-1">Description</label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md resize-none focus:ring-2 focus:ring-secondary/30 outline-none"
              />
            </div>
            <Select
              label="Priority"
              value={watch('priority')}
              onChange={(v) =>
                setValue('priority', v as CreateTaskFormValues['priority'], { shouldValidate: true })
              }
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              minWidthClass="w-full"
            />

            {needsTeam ? (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-3">
                <p className="text-body-sm text-on-surface-variant">
                  This project has no team assigned. Assign a team first, then you can pick a
                  team member as the task assignee.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose()
                    if (projectId != null) {
                      safeNavigate(navigate, {
                        to: projectRoutes.projectDetailPath,
                        params: { projectId: String(projectId) },
                        search: { tab: 'team' },
                      })
                    }
                  }}
                >
                  Assign team first
                </Button>
              </div>
            ) : (
              <EntitySearch
                label="Assignee (team members)"
                placeholder={
                  membersQuery.isLoading
                    ? 'Loading team members…'
                    : teamId
                      ? 'Search team members…'
                      : 'Select assignee…'
                }
                options={employeeOptions}
                value={assignee}
                onChange={(opt) => {
                  setAssignee(opt)
                  setValue('assigneeName', opt?.label ?? '')
                }}
                disabled={membersQuery.isLoading || !teamId}
                emptyMessage={
                  membersQuery.isError
                    ? 'Failed to load team members'
                    : 'No team members found'
                }
              />
            )}

            {(formError || create.isError) && (
              <p className="text-body-sm text-error" role="alert">
                {formError ?? getApiErrorMessage(create.error, 'Failed to create task.')}
              </p>
            )}
          </div>
          <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || create.isPending || needsTeam}
            >
              Create task
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
