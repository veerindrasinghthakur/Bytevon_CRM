import { Link, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { TeamTopView } from '../../components/team/TeamTopView'
import { useTeamDetail } from '../../hooks/team/use-team-detail'
import { projectRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'

export function TeamProjectsPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const { team, projects, isLoading, isError, refetch } = useTeamDetail(teamId)

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !team) {
    return <ErrorState title="Could not load team projects" onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={projectRoutes.teamDetail(team.id)} label="Back to team" />
        <TeamTopView team={team} activeTab="projects" />
      </div>
      <div className="grid gap-4">
        {projects.map((p) => (
          <Link
            key={p.id}
            {...looseLinkProps({
              to: projectRoutes.projectDetailPath,
              params: { projectId: String(p.id) },
              className: 'bv-surface p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between',
            })}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-title-md font-semibold text-secondary">{p.name}</h2>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold status-badge')}>{p.status}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant">Client: {p.client} · Due {p.due}</p>
              <div className="mt-3 flex items-center gap-3 max-w-md">
                <div className="flex-1 h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
                <span className="text-label-md font-bold">{p.pct}%</span>
              </div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="bv-surface p-10 text-center text-body-sm text-on-surface-variant">
            No projects linked to this team yet.
          </div>
        )}
      </div>
    </div>
  )
}
