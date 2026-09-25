import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { projectRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'
import { getProjects, updateProject } from '../../api/project'
import { getTeam } from '../../api/team'
import { queryKeys } from '@/shared/lib/query-keys'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

const assignProjectSchema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  role: z.string().min(1),
  notes: z.string().optional().or(z.literal('')),
})
type AssignProjectForm = z.infer<typeof assignProjectSchema>

export function AssignProjectPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const numericTeamId = Number(teamId)

  const teamQuery = useQuery({
    queryKey: queryKeys.teams.detail(numericTeamId),
    queryFn: () => getTeam(numericTeamId),
    enabled: Number.isFinite(numericTeamId),
  })

  const projectsQuery = useQuery({
    queryKey: ['projects', 'assignable-for-team', numericTeamId],
    queryFn: () => getProjects({ pageSize: 200 }),
    enabled: Number.isFinite(numericTeamId),
  })

  const form = useForm<AssignProjectForm>({
    resolver: zodResolver(assignProjectSchema),
    defaultValues: { projectId: '', role: 'Primary', notes: '' },
  })

  const selected = form.watch('projectId')
  const teamName = teamQuery.data?.name ?? `Team #${teamId}`
  // All projects are assignable (re-assignment allowed); the team's current
  // project is marked so the user sees what will change.
  const assignable = useMemo(() => projectsQuery.data?.items ?? [], [projectsQuery.data])

  const assignMutation = useMutation({
    mutationFn: (projectId: number) =>
      updateProject(projectId, {
        teamId: numericTeamId,
        assignmentType: 'TEAM',
        assignedToId: numericTeamId,
      }),
    onSuccess: async (_data, projectId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.projects(numericTeamId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(numericTeamId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) }),
      ])
      safeNavigate(navigate, {
        to: projectRoutes.teamProjectsPath,
        params: { teamId: String(numericTeamId) },
      })
    },
  })

  useEffect(() => {
    if (assignable.length === 0) form.setValue('projectId', '')
  }, [assignable.length, form])

  const onSubmit = form.handleSubmit((values) => {
    const pid = Number(values.projectId)
    if (Number.isFinite(pid)) assignMutation.mutate(pid)
  })

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <BackButton to={projectRoutes.teamDetail(String(numericTeamId))} label="Back to team" />
        <h1 className="text-headline-xl font-bold mt-2">Assign to Project</h1>
        <p className="text-body-md text-on-surface-variant">
          Link <strong>{teamName}</strong> to a project. Already-assigned projects can be
          re-assigned here.
        </p>
      </div>
      <form className="bv-surface p-6 space-y-5" onSubmit={onSubmit}>
        {(teamQuery.isLoading || projectsQuery.isLoading) && <Skeleton className="h-14 w-full" />}
        {!projectsQuery.isLoading && assignable.length === 0 && (
          <p className="text-body-sm text-on-surface-variant py-6 text-center border border-dashed border-outline-variant rounded-lg">
            No projects available.
          </p>
        )}
        <ul className="space-y-2">
          {assignable.map((p) => {
            const active = selected === String(p.id)
            const isCurrent = p.teamId === numericTeamId
            const assignedElsewhere = p.teamId != null && !isCurrent
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => form.setValue('projectId', String(p.id), { shouldValidate: true })}
                  className={cn(
                    'w-full text-left rounded-lg border px-4 py-3',
                    active ? 'border-secondary bg-secondary/5' : 'border-outline-variant',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-body-sm">{p.name}</p>
                    {isCurrent ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                        Current
                      </span>
                    ) : assignedElsewhere ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        Team #{p.teamId}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-on-surface-variant">{p.clientName ?? '—'}</p>
                </button>
              </li>
            )
          })}
        </ul>
        <Select
          label="Team role on project"
          value={form.watch('role')}
          onChange={(v) => form.setValue('role', v)}
          options={[
            { value: 'Primary', label: 'Primary' },
            { value: 'Support', label: 'Support' },
            { value: 'Consulting', label: 'Consulting' },
          ]}
          minWidthClass="w-full"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => safeNavigate(navigate, { to: projectRoutes.teamDetailPath, params: { teamId: String(numericTeamId) } })}>
            Cancel
          </Button>
          <Can action={Action.UPDATE} resource="project">
            <Button type="submit" variant="primary" isLoading={assignMutation.isPending} disabled={assignable.length === 0}>
              Assign team
            </Button>
          </Can>
        </div>
      </form>
    </div>
  )
}
