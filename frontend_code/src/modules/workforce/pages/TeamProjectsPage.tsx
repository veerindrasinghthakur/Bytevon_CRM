import { Link, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { teams } from '../data/mock'
import { projectsFor } from '../data/teamExtraMock'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { TeamTopView } from '../components/TeamTopView'
import { cn } from '@/shared/lib/cn'

const statusClass: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-sky-100 text-sky-800',
  'On Hold': 'bg-amber-100 text-amber-800',
}

const PROJECT_ROUTE_IDS: Record<string, string> = {
  p1: '1024',
  p2: '1027',
  p3: '1028',
  p4: '1029',
}

export function TeamProjectsPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const t = teams.find((x) => x.id === teamId) ?? teams[0]
  const projects = projectsFor(t.id)

  return (
    <div className="space-y-6">
      <div>
        <BackButton to={`/workforce/teams/${t.id}`} label="Back to team" />
        <DynamicRouteCrumbs
          className="mt-2 mb-2"
          lastLabel="Project History"
          labelOverrides={{ [t.id]: t.name, projects: 'Project History' }}
        />
        <TeamTopView team={t} activeTab="projects" />
      </div>

      <div className="grid gap-4">
        {projects.map((p) => {
          const routeId = PROJECT_ROUTE_IDS[p.id] ?? '1024'
          return (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: routeId }}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between hover:border-secondary transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-title-md font-semibold text-secondary">{p.name}</h2>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', statusClass[p.status])}>
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
              <span className="material-symbols-outlined text-on-surface-variant shrink-0">chevron_right</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
