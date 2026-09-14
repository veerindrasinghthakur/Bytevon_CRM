import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getTeamMembers } from '../api/teams'
import { workforceRoutes } from '@/modules/workforce/routes'
import type { Team, TeamMemberRow } from '../types'

type Props = {
  projectId: number
  projectName?: string
  linkedTeam: Team | null
  /** Optional preloaded members — if omitted, fetched by team id */
  members?: TeamMemberRow[]
  membersLoading?: boolean
}

/** Read-only team info for project detail: head + members. */
export function ProjectTeamTab({
  linkedTeam,
  members: membersProp,
  membersLoading: loadingProp,
}: Props) {
  const navigate = useNavigate()
  const teamId = linkedTeam?.id

  const membersQuery = useQuery({
    queryKey: ['projects', 'team-members', teamId],
    queryFn: () => getTeamMembers(teamId!),
    enabled: teamId != null && membersProp == null,
  })

  const members = membersProp ?? membersQuery.data ?? []
  const loading = loadingProp ?? membersQuery.isLoading

  const head =
    members.find((m) => m.isHead || m.role === 'Lead' || String(m.role).toLowerCase().includes('head')) ??
    null

  if (!linkedTeam) {
    return (
      <section className="bv-surface p-6">
        <p className="text-body-md text-on-surface-variant">
          No team is assigned to this project yet. Assign a team from Workforce → Teams, or when
          creating the project.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          size="sm"
          onClick={() => safeNavigate(navigate, { to: workforceRoutes.teams })}
        >
          Open Teams
        </Button>
      </section>
    )
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
              <p className="text-lg font-bold">{linkedTeam.name}</p>
              <p className="text-sm text-on-surface-variant">
                {linkedTeam.memberCount} members
                {linkedTeam.department ? ` · ${linkedTeam.department}` : ''}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              safeNavigate(navigate, {
                to: workforceRoutes.teamDetailPath,
                params: { teamId: String(linkedTeam.id) },
              })
            }
          >
            Open in Workforce
          </Button>
        </div>
      </section>

      <section className="bv-surface p-6">
        <h3 className="text-title-md font-semibold mb-4">Team head</h3>
        {loading && <Skeleton className="h-16 w-full" />}
        {!loading && (head || linkedTeam.headName) && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-low/40">
            <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-sm font-bold">
              {(head?.name ?? linkedTeam.headName ?? '?')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold">{head?.name ?? linkedTeam.headName}</p>
              <p className="text-caption text-on-surface-variant">
                {head?.title ?? linkedTeam.headRole ?? 'Team Head'}
              </p>
            </div>
          </div>
        )}
        {!loading && !head && !linkedTeam.headName && (
          <p className="text-body-sm text-on-surface-variant">No team head recorded.</p>
        )}
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="text-title-md font-semibold">Team members</h3>
        </div>
        {loading && (
          <div className="p-5">
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {!loading && members.length === 0 && (
          <p className="p-5 text-body-sm text-on-surface-variant">No members returned for this team.</p>
        )}
        {!loading && members.length > 0 && (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                <th className="px-5 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                  Member
                </th>
                <th className="px-5 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                  Role
                </th>
                <th className="px-5 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {members.map((m) => (
                <tr key={String(m.id ?? m.employmentId ?? m.name)} className="zebra-row">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                        {m.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        {m.title && (
                          <p className="text-caption text-on-surface-variant">{m.title}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-body-sm">{m.role}</td>
                  <td className="px-5 py-3 text-body-sm">{m.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
