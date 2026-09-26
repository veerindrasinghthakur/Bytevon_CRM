import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { TeamTopView } from '../../components/team/TeamTopView'
import { RemoveMemberButton } from '../../components/team/RemoveMemberButton'
import { useTeamDetail } from '../../hooks/team/use-team-detail'
import { projectRoutes } from '../../routes'
import { workforceRoutes } from '@/modules/workforce/routes'
import { Can } from '@/shared/rbac'
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
  const navigate = useNavigate()
  const { team, members, history, isLoading, isError, refetch, removeMember, isRemoving } =
    useTeamDetail(teamId)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return members.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.title ?? '').toLowerCase().includes(q) ||
        (m.role ?? '').toLowerCase().includes(q),
    )
  }, [members, query])

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !team) {
    return (
      <ErrorState title="Could not load team members" onRetry={() => void refetch()} />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={projectRoutes.teamDetail(team.id)} label="Back to team" />
        <TeamTopView team={team} activeTab="members" />
      </div>
      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none"
              placeholder="Search members…"
            />
          </div>
          <Can action="CREATE" resource="project" minScope="TEAM">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icon name="person_add" />}
              onClick={() =>
                safeNavigate(navigate, {
                  to: projectRoutes.teamAddMemberPath,
                  params: { teamId: String(team.id) },
                })
              }
            >
              Add Member
            </Button>
          </Can>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant">
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Member</th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden md:table-cell">Role</th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden lg:table-cell">Joined</th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filtered.map((m) => (
              <tr key={m.id} className="zebra-row">
                <td className="px-6 py-4">
                  <Link
                    {...looseLinkProps({
                      to: workforceRoutes.employeeDetailPath,
                      params: { employeeId: String(m.employmentId ?? m.id) },
                      className: 'flex items-center gap-3',
                    })}
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                      {m.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-body-sm text-secondary">{m.name}</p>
                      <p className="text-caption text-on-surface-variant">
                        {[m.title, m.code ? `Emp #${m.code}` : m.employmentId ? `Emp #${m.employmentId}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-body-sm hidden md:table-cell">{m.role}</td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant hidden lg:table-cell">
                  {m.joined ?? '—'}
                </td>
                <td className="px-6 py-4">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', m.status === 'Active' ? 'status-badge status-success' : 'status-badge status-warning')}>
                    {m.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Can action="DELETE" resource="project" minScope="TEAM">
                    <RemoveMemberButton
                      memberName={m.name}
                      employmentId={m.employmentId}
                      disabled={isRemoving}
                      isRemoving={isRemoving}
                      onRemove={(empId) => removeMember(empId)}
                    />
                  </Can>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {history.length > 0 && (
        <div className="bv-surface overflow-hidden">
          <div className="p-4 border-b border-outline-variant">
            <h2 className="text-headline-md font-semibold flex items-center gap-2">
              <Icon name="history" className="text-secondary" /> Member History
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Previous members are kept as a record. Re-adding creates a new entry.
            </p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Member</th>
                <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden md:table-cell">Role</th>
                <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden lg:table-cell">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {history.map((m) => (
                <tr key={m.id} className="zebra-row opacity-80">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-body-sm">{m.name}</p>
                    <p className="text-caption text-on-surface-variant">
                      {m.code ? `Emp #${m.code}` : m.employmentId ? `Emp #${m.employmentId}` : ''}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-body-sm hidden md:table-cell">{m.role}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant hidden lg:table-cell">
                    {m.joined ?? '—'} → {m.leftDate ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
