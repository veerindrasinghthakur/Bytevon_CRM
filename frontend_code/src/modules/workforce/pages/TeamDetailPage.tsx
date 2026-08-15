import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { teams } from '../data/mock'
import { membersFor, projectsFor } from '../data/teamExtraMock'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { TeamTopView } from '../components/TeamTopView'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

/** Project mock ids → real project detail route ids */
const PROJECT_ROUTE_IDS: Record<string, string> = {
  p1: '1024',
  p2: '1027',
  p3: '1028',
  p4: '1029',
}

export function TeamDetailPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const t = teams.find((x) => x.id === teamId) ?? teams[0]
  const members = membersFor(t.id).slice(0, 3)
  const projects = projectsFor(t.id).filter((p) => p.status === 'Active').slice(0, 2)

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/workforce/teams" label="Back to Teams" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: '/workforce/employees' },
            { label: 'Teams', to: '/workforce/teams' },
            { label: t.name },
          ]}
        />
        <TeamTopView team={t} activeTab="overview" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {t.mission && (
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
              <h2 className="text-headline-md font-semibold mb-3 flex items-center gap-2">
                <Icon name="flag" className="text-secondary" /> Team Mission
              </h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed">{t.mission}</p>
            </div>
          )}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-headline-md font-semibold flex items-center gap-2">
                <Icon name="account_tree" className="text-secondary" /> Active Projects
              </h2>
              <button
                type="button"
                className="text-secondary text-label-md font-bold"
                onClick={() =>
                  navigate({ to: '/workforce/teams/$teamId/projects', params: { teamId: t.id } })
                }
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {projects.map((p) => {
                const routeId = PROJECT_ROUTE_IDS[p.id] ?? '1024'
                return (
                  <Link
                    key={p.id}
                    to="/projects/$projectId"
                    params={{ projectId: routeId }}
                    className="block border border-outline-variant rounded-lg p-4 hover:border-secondary transition-colors"
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
                )
              })}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <h2 className="text-headline-md font-semibold mb-4 flex items-center gap-2">
              <Icon name="groups" className="text-secondary" /> Key Members
            </h2>
            <div className="space-y-3">
              {members.map((m) => (
                <Link
                  key={m.id}
                  to="/workforce/employees/$employeeId"
                  params={{ employeeId: m.id }}
                  className="flex items-center gap-3 rounded-lg p-1 hover:bg-surface-container-low"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                    {m.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-caption text-on-surface-variant">{m.title}</p>
                  </div>
                </Link>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() =>
                navigate({ to: '/workforce/teams/$teamId/members', params: { teamId: t.id } })
              }
            >
              View All {t.memberCount} Members
            </Button>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <h2 className="text-headline-md font-semibold mb-4 flex items-center gap-2">
              <Icon name="history" className="text-secondary" /> Recent Activity
            </h2>
            <div className="space-y-4 border-l-2 border-surface-variant ml-2 pl-4">
              <div>
                <p className="text-body-sm font-medium">Code merge to main for Nexus Data Migration.</p>
                <p className="text-caption text-on-surface-variant">Today, 10:30 AM</p>
              </div>
              <div>
                <p className="text-body-sm font-medium">Team sync: Q4 Planning finalized.</p>
                <p className="text-caption text-on-surface-variant">Yesterday, 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
