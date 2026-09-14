import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { workforceRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'
import { assignProjectSchema, type AssignProjectForm } from '../schemas/assign-project-form'
import { TEAM_PROJECT_ROLE_OPTIONS } from '../schemas/enums'
import { getProjects, updateProject } from '@/modules/projects/api/project'
import { getTeam } from '@/modules/projects/api/team'
import { queryKeys } from '@/shared/lib/query-keys'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function statusLabel(status: string): string {
  const s = String(status).toUpperCase()
  if (s === 'PLANNING' || s === 'PLANNED') return 'Planning'
  if (s === 'IN_PROGRESS' || s === 'ACTIVE') return 'Active'
  if (s === 'ON_HOLD') return 'On Hold'
  if (s === 'COMPLETED') return 'Completed'
  return status
}

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
    queryKey: ['projects', 'unassigned-for-team', numericTeamId],
    queryFn: () => getProjects({ unassignedOnly: true, pageSize: 200 }),
    enabled: Number.isFinite(numericTeamId),
  })

  const form = useForm<AssignProjectForm>({
    resolver: zodResolver(assignProjectSchema),
    defaultValues: { projectId: '', role: 'Primary', notes: '' },
  })

  const selected = form.watch('projectId')
  const team = teamQuery.data
  const teamName = team?.name ?? `Team #${teamId}`

  const assignable = useMemo(() => {
    const items = projectsQuery.data?.items ?? []
    return items.filter((p) => p.teamId == null)
  }, [projectsQuery.data])

  const assignMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return updateProject(projectId, {
        teamId: numericTeamId,
        assignmentType: 'TEAM',
        assignedToId: numericTeamId,
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.projects(numericTeamId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(numericTeamId) }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
      ])
      safeNavigate(navigate, {
        to: workforceRoutes.teamProjectsPath,
        params: { teamId: String(numericTeamId) },
      })
    },
  })

  useEffect(() => {
    if (assignable.length === 0) form.setValue('projectId', '')
  }, [assignable.length, form])

  const onSubmit = form.handleSubmit((values) => {
    const pid = Number(values.projectId)
    if (!Number.isFinite(pid)) return
    assignMutation.mutate(pid)
  })

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <BackButton
          to={workforceRoutes.teamDetail(String(numericTeamId))}
          label="Back to team"
        />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: workforceRoutes.employees },
            { label: 'Teams', to: workforceRoutes.teams },
            { label: teamName, to: workforceRoutes.teamDetail(String(numericTeamId)) },
            { label: 'Assign project' },
          ]}
        />
        <h1 className="text-headline-xl font-bold">Assign to Project</h1>
        <p className="text-body-md text-on-surface-variant">
          Link <strong>{teamName}</strong> to a project that has no team assignment yet.
        </p>
      </div>

      <form className="bv-surface p-6 space-y-5" onSubmit={onSubmit}>
        <section>
          <h2 className="text-title-md font-semibold mb-3 flex items-center gap-2">
            <Icon name="account_tree" className="text-secondary" /> Select unassigned project
          </h2>

          {(teamQuery.isLoading || projectsQuery.isLoading) && (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          )}

          {!projectsQuery.isLoading && assignable.length === 0 && (
            <p className="text-body-sm text-on-surface-variant py-6 text-center border border-dashed border-outline-variant rounded-lg">
              No unassigned projects available. Create a project without a team, or unassign one
              first.
            </p>
          )}

          {!projectsQuery.isLoading && assignable.length > 0 && (
            <ul className="space-y-2">
              {assignable.map((p) => {
                const active = selected === String(p.id)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue('projectId', String(p.id), { shouldValidate: true })
                      }
                      className={cn(
                        'w-full text-left rounded-lg border px-4 py-3 transition-all',
                        active
                          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                          : 'border-outline-variant hover:bg-surface-container-low',
                      )}
                    >
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-semibold text-body-sm">{p.name}</p>
                          <p className="text-caption text-on-surface-variant">
                            {p.clientName?.trim() ? p.clientName : '—'}
                            {p.code ? ` · ${p.code}` : ''}
                          </p>
                        </div>
                        <span className="text-caption text-on-surface-variant">
                          {statusLabel(p.status)}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {form.formState.errors.projectId && (
            <p className="text-xs text-error mt-2">{form.formState.errors.projectId.message}</p>
          )}
          {assignMutation.isError && (
            <p className="text-xs text-error mt-2" role="alert">
              {(assignMutation.error as Error)?.message ?? 'Failed to assign project'}
            </p>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Team role on project"
            value={form.watch('role')}
            onChange={(v) => form.setValue('role', v)}
            options={[...TEAM_PROJECT_ROLE_OPTIONS]}
            minWidthClass="w-full"
            aria-label="Team role on project"
          />
          <label className="block text-body-sm sm:col-span-2">
            <span className="text-on-surface-variant">Notes</span>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md resize-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
              placeholder="Optional context for project managers…"
            />
          </label>
        </section>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              safeNavigate(navigate, {
                to: workforceRoutes.teamDetailPath,
                params: { teamId: String(numericTeamId) },
              })
            }
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={assignMutation.isPending}
            disabled={assignable.length === 0}
          >
            Assign team
          </Button>
        </div>
      </form>
    </div>
  )
}
