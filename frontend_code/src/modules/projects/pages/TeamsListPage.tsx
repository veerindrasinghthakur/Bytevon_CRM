import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useTeams } from '../hooks/use-teams'

/** Same layout pattern as ProjectsListPage: title + CTAs, search left / filters right, metric cards, table. */
export function TeamsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useTeams({
    search: search || undefined,
  })

  const total = data?.total ?? 0
  const activeMembers = data?.items.reduce((s, t) => s + t.memberCount, 0) ?? 0
  const totalProjects = data?.items.reduce((s, t) => s + t.projectCount, 0) ?? 0
  const avgSize = total > 0 ? (activeMembers / total).toFixed(1) : '0'

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-background">
            Teams
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage and organize your cross-functional teams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
            onClick={() => console.info('Export teams')}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/projects/teams/new' })}
          >
            New Team
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <div className="flex items-center flex-1 min-w-[200px] max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-2 focus-within:border-electric-blue">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-background placeholder:text-on-surface-variant"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-background focus:outline-none focus:border-electric-blue cursor-pointer">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-background focus:outline-none focus:border-electric-blue cursor-pointer">
              <option value="">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface-variant hover:text-electric-blue"
            aria-label="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Teams"
          value={String(total || '—')}
          trend="+12%"
          icon="groups"
          iconClass="bg-electric-blue/10 text-electric-blue"
        />
        <MetricCard
          label="Active Members"
          value={String(activeMembers)}
          trend="+4%"
          icon="person"
          iconClass="bg-purple-100 text-purple-600"
        />
        <MetricCard
          label="Total Projects"
          value={String(totalProjects)}
          sub="Active"
          icon="account_tree"
          iconClass="bg-emerald-100 text-emerald-700"
        />
        <MetricCard
          label="Avg. Team Size"
          value={avgSize}
          sub="Members"
          icon="group_work"
          iconClass="bg-amber-100 text-amber-700"
        />
      </section>

      {isLoading && <TableSkeleton rows={4} />}
      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load teams.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState
          icon="groups"
          title="No teams yet"
          description="Create your first team to start organizing project members."
          actionLabel="New Team"
          onAction={() => navigate({ to: '/projects/teams/new' })}
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface/50">
                  <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Team Name</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Head</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Members</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Projects</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.items.map((team) => (
                  <tr key={team.id} className="h-[72px]">
                    <td className="py-2 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <span className="material-symbols-outlined">groups</span>
                        </div>
                        <div>
                          <p className="text-body-md font-semibold text-on-background">{team.name}</p>
                          <p className="text-[11px] text-on-surface-variant">{team.department ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      {team.headName ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-background">
                            {team.headName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-body-md font-medium text-on-background">{team.headName}</p>
                            <p className="text-[11px] text-on-surface-variant">{team.headRole}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-body-md text-on-surface-variant italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-medium text-on-background">
                        {team.memberCount}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-body-md font-medium text-on-background">{team.projectCount}</span>
                        {team.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-6 text-right">
                      <div className="flex justify-end">
                        <RowActions
                          label={`Actions for ${team.name}`}
                          actions={[
                            {
                              id: 'view',
                              label: 'View',
                              icon: 'description',
                              onClick: () => console.info('View team', team.id),
                            },
                            {
                              id: 'edit',
                              label: 'Edit',
                              icon: 'edit',
                              onClick: () => console.info('Edit team', team.id),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-outline-variant/30 p-4 flex items-center justify-between">
            <p className="text-[11px] text-on-surface-variant">
              Showing <span className="font-semibold text-on-background">1-{data.items.length}</span> of{' '}
              <span className="font-semibold text-on-background">{data.total}</span> Teams
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  trend,
  sub,
  icon,
  iconClass,
}: {
  label: string
  value: string
  trend?: string
  sub?: string
  icon: string
  iconClass: string
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {trend && (
          <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">{trend}</div>
        )}
      </div>
      <div>
        <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <h3 className="text-[32px] font-bold text-on-background leading-none">{value}</h3>
          {sub && <span className="text-label-sm text-on-surface-variant mb-0.5">{sub}</span>}
        </div>
      </div>
    </div>
  )
}
