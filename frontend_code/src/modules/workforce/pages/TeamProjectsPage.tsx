import { Link, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { TeamTopView } from '../components/TeamTopView'
import { useTeamDetail } from '../hooks/use-team-detail'
import { cn } from '@/shared/lib/cn'

const statusClass: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-sky-100 text-sky-800',
  'On Hold': 'bg-amber-100 text-amber-800',
}

export function TeamProjectsPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const { team, projects, isLoading, isError, refetch } = useTeamDetail(teamId)

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !team) {
    return (
      <ErrorState
        title="Could not load team projects"
        description="Retry or go back to the team overview."
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={`/workforce/teams/${team.id}`} label="Back to team" />
        <DynamicRouteCrumbs
          className="mt-2 mb-2"
          lastLabel="Project History"
          labelOverrides={{ [team.id]: team.name, projects: 'Project History' }}
        />
        <TeamTopView team={team} activeTab="projects" />
      </div>

      <div className="grid gap-4">
        {projects.map((p) => (
          <Link
            key={p.id}
            to="/projects/$projectId"
            params={{ projectId: String(p.id) }}
            search={{}}
            className="bv-surface card-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-title-md font-semibold text-secondary">{p.name}</h2>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    statusClass[p.status],
                  )}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Client: {p.client} · Role: {p.role} · Due {p.due}
              </p>
              <div className="mt-3 flex items-center gap-3 max-w-md">
                <div className="flex-1 h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
                <span className="text-label-md font-bold">{p.pct}%</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant shrink-0">
              chevron_right
            </span>
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
