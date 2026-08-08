import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useTeams } from '../hooks/use-teams'

/** Nav list page — search left, filters right (same pattern as Projects). No breadcrumbs. */
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-10 font-bold tracking-tight text-on-surface mb-2">Teams</h1>
          <p className="text-body-lg text-on-surface-variant">
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
      </div>

      <section className="flex flex-wrap items-center gap-4">
        <div className="flex items-center flex-1 min-w-[200px] max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-2 focus-within:border-electric-blue">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md cursor-pointer">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md cursor-pointer">
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
            className="p-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface-variant"
            aria-label="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Teams" value={String(total)} trend="+12%" icon="groups" />
        <MetricCard label="Active Members" value={String(activeMembers)} trend="+4%" icon="person" />
        <MetricCard label="Total Projects" value={String(totalProjects)} sub="Active" icon="account_tree" />
        <MetricCard label="Avg. Team Size" value={avgSize} sub="Members" icon="group_work" />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {isLoading && (
          <div className="p-6">
            <TableSkeleton rows={4} />
          </div>
        )}
        {isError && (
          <div className="p-6 text-center">
            <p className="text-body-md text-error mb-3">Failed to load teams.</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}
        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon="groups"
              title="No teams yet"
              description="Create your first team to start organizing project members."
              actionLabel="New Team"
              onAction={() => navigate({ to: '/projects/teams/new' })}
            />
          </div>
        )}
        {!isLoading && !isError && data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-outline-variant/30">
                  <th className="px-6 py-4 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">Team Name</th>
                  <th className="px-6 py-4 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">Head</th>
                  <th className="px-6 py-4 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">Members</th>
                  <th className="px-6 py-4 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">Projects</th>
                  <th className="px-6 py-4 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.items.map((team) => (
                  <tr key={team.id} className="h-[72px]">
                    <td className="px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <span className="material-symbols-outlined">groups</span>
                        </div>
                        <div>
                          <div className="text-body-md font-semibold text-on-surface">{team.name}</div>
                          <div className="text-[11px] text-on-surface-variant">{team.department ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6">
                      {team.headName ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold">
                            {team.headName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-body-md font-medium">{team.headName}</div>
                            <div className="text-[11px] text-on-surface-variant">{team.headRole}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-body-md text-on-surface-variant italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-medium">
                        {team.memberCount}
                      </div>
                    </td>
                    <td className="px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-body-md font-medium">{team.projectCount}</span>
                        {team.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 text-right">
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
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  trend,
  sub,
  icon,
}: {
  label: string
  value: string
  trend?: string
  sub?: string
  icon: string
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32">
      <div className="flex items-start justify-between">
        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-electric-blue/10 flex items-center justify-center text-electric-blue">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[32px] font-bold text-on-surface leading-none">{value}</span>
        {trend && (
          <span className="text-label-sm text-emerald-600 font-medium mb-1 flex items-center">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span> {trend}
          </span>
        )}
        {sub && <span className="text-label-sm text-on-surface-variant mb-1">{sub}</span>}
      </div>
    </div>
  )
}
