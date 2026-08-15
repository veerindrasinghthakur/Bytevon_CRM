import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { teams } from '../data/mock'
import { projectsFor } from '../data/teamExtraMock'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

const statusClass: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-sky-100 text-sky-800',
  'On Hold': 'bg-amber-100 text-amber-800',
}

export function TeamProjectsPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const t = teams.find((x) => x.id === teamId) ?? teams[0]
  const projects = projectsFor(t.id)

  return (
    <div className="space-y-6">
      <div>
        <BackButton to={`/workforce/teams/${t.id}`} label="Back to team" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: '/workforce/employees' },
            { label: 'Teams', to: '/workforce/teams' },
            { label: t.name, to: `/workforce/teams/${t.id}` },
            { label: 'Projects' },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-headline-xl font-bold">{t.name} — Projects</h1>
            <p className="text-body-md text-on-surface-variant">Active and historical project assignments</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Icon name="assignment_add" />}
            onClick={() => navigate({ to: '/workforce/teams/$teamId/assign-project', params: { teamId: t.id } })}
          >
            Assign to Project
          </Button>
        </div>
      </div>

      <div className="border-b border-outline-variant flex gap-6">
        {[
          { label: 'Overview', to: `/workforce/teams/${t.id}` },
          { label: 'Members', to: `/workforce/teams/${t.id}/members` },
          { label: 'Project History', to: `/workforce/teams/${t.id}/projects`, active: true },
        ].map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            className={cn(
              'pb-3 text-label-md font-bold border-b-2',
              tab.active ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-title-md font-semibold">{p.name}</h2>
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
          </div>
        ))}
      </div>
    </div>
  )
}
