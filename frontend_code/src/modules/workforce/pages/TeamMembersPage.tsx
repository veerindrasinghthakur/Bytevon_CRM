import { useMemo, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { TeamTopView } from '../components/TeamTopView'
import { useTeamDetail } from '../hooks/use-team-detail'
import { workforceRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function TeamMembersPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const { team, members, isLoading, isError, refetch } = useTeamDetail(teamId)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return members.filter(
      (m) => !q || m.name.toLowerCase().includes(q) || m.title.toLowerCase().includes(q),
    )
  }, [members, query])

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !team) {
    return (
      <ErrorState
        title="Could not load team members"
        description="Retry or go back to the team overview."
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={workforceRoutes.teamDetail(team.id)} label="Back to team" />
        <DynamicRouteCrumbs
          className="mt-2 mb-2"
          lastLabel="Members"
          labelOverrides={{ [team.id]: team.name }}
        />
        <TeamTopView team={team} activeTab="members" />
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <div className="relative max-w-sm">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
              placeholder="Search members…"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant">
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                Member
              </th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden md:table-cell">
                Role
              </th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">
                Joined
              </th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filtered.map((m) => (
              <tr key={m.id} className="zebra-row">
                <td className="px-6 py-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Link
                    {...(looseLinkProps({
                      to: workforceRoutes.employeeDetailPath,
                      params: { employeeId: String(m.id) },
                      className: 'flex items-center gap-3 hover:opacity-90',
                    }) as any)}
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                      {m.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-body-sm text-secondary">{m.name}</p>
                      <p className="text-caption text-on-surface-variant">{m.title}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-body-sm hidden md:table-cell">{m.role}</td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant hidden sm:table-cell">
                  {m.joined}
                </td>
                <td className="px-6 py-4">
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
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-body-sm text-on-surface-variant">No members match.</div>
        )}
      </div>
    </div>
  )
}
