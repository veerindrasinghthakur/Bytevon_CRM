import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { EntitySearch, type EntityOption } from '@/shared/components/forms/EntitySearch'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { queryKeys } from '@/shared/lib/query-keys'
import { getTeams } from '../api/teams'
import { updateProject } from '../api/projects'
import { projectRoutes } from '../routes'
import type { Team } from '../types'

type Props = {
  projectId: number
  projectName?: string
  linkedTeam: Team | null
  onAssigned?: () => void
}

export function ProjectTeamTab({ projectId, projectName, linkedTeam, onAssigned }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<EntityOption | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ forProjectAssign: true }),
    queryFn: () => getTeams({ page: 1, pageSize: 200 }),
    staleTime: 60_000,
  })

  const teamOptions: EntityOption[] = useMemo(
    () =>
      (teamsQuery.data?.items ?? []).map((t) => ({
        id: t.id,
        label: t.name,
        sublabel: [t.department, t.headName ? `Head: ${t.headName}` : null, `${t.memberCount} members`]
          .filter(Boolean)
          .join(' · '),
      })),
    [teamsQuery.data],
  )

  const assignTeam = async () => {
    setError(null)
    if (!selected) {
      setError('Select a team to assign.')
      return
    }
    const teamId = Number(selected.id)
    if (!Number.isFinite(teamId)) {
      setError('Invalid team.')
      return
    }
    setSaving(true)
    try {
      await updateProject(projectId, {
        assignmentType: 'TEAM',
        assignedToId: teamId,
        teamId,
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: ['projects', 'teams-for-project', projectId] })
      setSelected(null)
      onAssigned?.()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to assign team.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="bv-surface p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <div>
              <p className="text-lg font-bold">{linkedTeam?.name ?? 'No team assigned'}</p>
              <p className="text-sm text-on-surface-variant">
                {linkedTeam
                  ? `${linkedTeam.memberCount} members · Lead: ${linkedTeam.headName ?? '—'}`
                  : 'Assign an existing team or create a new one for this project.'}
              </p>
            </div>
          </div>
          {linkedTeam && (
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                safeNavigate(navigate, {
                  to: projectRoutes.teamDetailPath,
                  params: { teamId: String(linkedTeam.id) },
                })
              }
            >
              Open team detail
            </Button>
          )}
        </div>
      </section>

      {!linkedTeam && (
        <section className="bv-surface p-6 space-y-4">
          <h3 className="text-title-md font-semibold">Assign to team</h3>
          <EntitySearch
            label="Search teams"
            placeholder={
              teamsQuery.isLoading ? 'Loading teams…' : 'Type team name, department, or head…'
            }
            options={teamOptions}
            value={selected}
            onChange={setSelected}
            disabled={teamsQuery.isLoading}
            emptyMessage="No teams match — create a new team"
          />
          {error && (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" isLoading={saving} onClick={() => void assignTeam()}>
              Assign selected team
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                safeNavigate(navigate, {
                  to: projectRoutes.teamNew,
                  search: {
                    projectId: String(projectId),
                    returnTo: projectRoutes.projectDetail(projectId),
                  },
                })
              }
            >
              Create new team
            </Button>
          </div>
          {projectName && (
            <p className="text-body-sm text-on-surface-variant">
              New team will be linked to <strong>{projectName}</strong> after creation.
            </p>
          )}
        </section>
      )}

      {linkedTeam && (
        <section className="bv-surface p-6">
          <p className="text-body-sm text-on-surface-variant mb-3">Change assignment</p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                safeNavigate(navigate, {
                  to: projectRoutes.teamNew,
                  search: {
                    projectId: String(projectId),
                    returnTo: projectRoutes.projectDetail(projectId),
                  },
                })
              }
            >
              Create & switch to new team
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
