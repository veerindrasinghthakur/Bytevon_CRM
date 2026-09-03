import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { TeamTopView } from '../components/TeamTopView'
import { useTeamDetail } from '../hooks/use-team-detail'
import { workforceRoutes } from '../routes'
import { projectRoutes } from '@/modules/projects/routes'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function TeamDetailPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const { team, members, projects, isLoading, isError, refetch } = useTeamDetail(teamId)

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !team) {
    return (
      <ErrorState
        title="Could not load team"
        description="Team detail failed to load. Retry or go back to teams."
        onRetry={() => void refetch()}
        onBack={() => safeNavigate(navigate, { to: workforceRoutes.teams })}
      />
    )
  }

  const previewMembers = members.slice(0, 6)
  const activeProjects = projects.filter((p) => p.status === 'Active').slice(0, 2)
  const tid = String(team.id)

  const goMembers = () =>
    safeNavigate(navigate, {
      to: workforceRoutes.teamMembersPath,
      params: { teamId: tid },
    })
  const goAddMember = () =>
    safeNavigate(navigate, {
      to: workforceRoutes.teamAddMemberPath,
      params: { teamId: tid },
    })
  const goProjects = () =>
    safeNavigate(navigate, {
      to: workforceRoutes.teamProjectsPath,
      params: { teamId: tid },
    })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={workforceRoutes.teams} label="Back to Teams" />
        <DynamicRouteCrumbs className="mt-2 mb-2" lastLabel={team.name} />
        <TeamTopView team={team} activeTab="overview" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {team.mission && (
            <div className="bv-surface p-5">
              <h2 className="text-headline-md font-semibold mb-3 flex items-center gap-2">
                <Icon name="flag" className="text-secondary" /> Team Mission
              </h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed">{team.mission}</p>
            </div>
          )}

          <div className="bv-surface overflow-hidden">
            <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant">
              <h2 className="text-headline-md font-semibold flex items-center gap-2">
                <Icon name="groups" className="text-secondary" /> Team Members
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Icon name="person_add" />}
                  onClick={goAddMember}
                >
                  Add Member
                </Button>
                <Button variant="outline" size="sm" onClick={goMembers}>
                  View all
                </Button>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                  <th className="px-5 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                    Member
                  </th>
                  <th className="px-5 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-5 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-label-sm font-medium text-on-surface-variant uppercase text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {previewMembers.map((m) => (
                  <tr key={m.id} className="zebra-row">
                    <td className="px-5 py-3">
                      <Link
                        {...looseLinkProps({
                          to: workforceRoutes.employeeDetailPath,
                          params: { employeeId: String(m.id) },
                          className: 'flex items-center gap-3',
                        })}
                      >
                        <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                          {m.name
                            .split(' ')
                            .map((p: string) => p[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-body-sm">{m.name}</p>
                          <p className="text-caption text-on-surface-variant">{m.title}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-body-sm hidden sm:table-cell">{m.role}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          m.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        {...looseLinkProps({
                          to: workforceRoutes.employeeDetailPath,
                          params: { employeeId: String(m.id) },
                          className: 'text-secondary text-label-md font-semibold hover:underline',
                        })}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length > previewMembers.length && (
              <div className="p-3 border-t border-outline-variant text-center">
                <button
                  type="button"
                  className="text-secondary text-label-md font-bold"
                  onClick={goMembers}
                >
                  View all {team.memberCount} members
                </button>
              </div>
            )}
          </div>

          <div className="bv-surface p-5">
            <div className="flex justify-between mb-4">
              <h2 className="text-headline-md font-semibold flex items-center gap-2">
                <Icon name="account_tree" className="text-secondary" /> Active Projects
              </h2>
              <button type="button" className="text-secondary text-label-md font-bold" onClick={goProjects}>
                View All
              </button>
            </div>
            <div className="space-y-3">
              {activeProjects.map((p) => (
                <Link
                  key={p.id}
                  {...looseLinkProps({
                    to: projectRoutes.projectDetailPath,
                    params: { projectId: String(p.id) },
                    className:
                      'block border border-outline-variant rounded-lg p-4 hover:border-secondary transition-colors card-hover',
                  })}
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-body-sm text-on-surface-variant">Client: {p.client}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-surface-variant text-secondary text-label-sm">
                      Due: {p.due}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-container-low rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className="text-label-md font-bold">{p.pct}%</span>
                  </div>
                </Link>
              ))}
              {activeProjects.length === 0 && (
                <p className="text-body-sm text-on-surface-variant">No active projects linked.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bv-surface p-5">
            <h2 className="text-headline-md font-semibold mb-4 flex items-center gap-2">
              <Icon name="history" className="text-secondary" /> Recent Activity
            </h2>
            <div className="space-y-4 border-l-2 border-surface-variant ml-2 pl-4">
              <div>
                <p className="text-body-sm font-medium">Team profile loaded from shared teams data.</p>
                <p className="text-caption text-on-surface-variant">Just now</p>
              </div>
              <div>
                <p className="text-body-sm font-medium">
                  {members.length} member{members.length === 1 ? '' : 's'} in department scope.
                </p>
                <p className="text-caption text-on-surface-variant">Synced</p>
              </div>
              <div>
                <p className="text-body-sm font-medium">
                  {projects.length} project{projects.length === 1 ? '' : 's'} linked.
                </p>
                <p className="text-caption text-on-surface-variant">Synced</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
