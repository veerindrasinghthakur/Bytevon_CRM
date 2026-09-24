import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Select } from '@/shared/components/ui/Select'
import { TeamTopView } from '../../components/team/TeamTopView'
import { RemoveMemberButton } from '../../components/team/RemoveMemberButton'
import { useTeamDetail } from '../../hooks/team/use-team-detail'
import { projectRoutes } from '../../routes'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { Can } from '@/shared/rbac'
import { cn } from '@/shared/lib/cn'
import { workforceRoutes } from '@/modules/workforce/routes'

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
  const {
    team,
    members,
    history,
    projects,
    isLoading,
    isError,
    detailError,
    refetch,
    removeMember,
    isRemoving,
    deleteTeam,
    isDeleting,
    changeHead,
    isChangingHead,
  } = useTeamDetail(teamId)
  const [changingHead, setChangingHead] = useState(false)
  const [headPick, setHeadPick] = useState('')

  const handleDelete = () => {
    deleteTeam()
    window.setTimeout(() => safeNavigate(navigate, { to: projectRoutes.teams }), 600)
  }

  useDeletedRedirect({ ready: !isLoading, data: team, error: detailError, listTo: projectRoutes.teams })

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !team) {
    return (
      <ErrorState
        title="Could not load team"
        description="Team detail failed to load. Retry or go back to teams."
        onRetry={() => void refetch()}
        onBack={() => safeNavigate(navigate, { to: projectRoutes.teams })}
      />
    )
  }

  const previewMembers = members.slice(0, 6)
  const activeProjects = projects.filter((p) => p.status === 'Active').slice(0, 2)
  const tid = String(team.id)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={projectRoutes.teams} label="Back to Teams" />
        <Can
          action="DELETE"
          resource="project"
          fallback={<TeamTopView team={team} activeTab="overview" />}
        >
          <TeamTopView team={team} activeTab="overview" onDelete={handleDelete} isDeleting={isDeleting} />
        </Can>
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
                <Can action="UPDATE" resource="project">
                  {!changingHead ? (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Icon name="person" />}
                      onClick={() => {
                        setHeadPick('')
                        setChangingHead(true)
                      }}
                    >
                      Change Head
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select
                        value={headPick}
                        onChange={setHeadPick}
                        options={[
                          { value: '', label: 'Select head…' },
                          ...members.map((m) => ({
                            value: String(m.employmentId ?? ''),
                            label: `${m.name}${m.code ? ` (${m.code})` : ''}`,
                          })),
                        ]}
                        minWidthClass="min-w-[200px]"
                        aria-label="Select team head"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!headPick || isChangingHead}
                        onClick={() => {
                          changeHead(Number(headPick))
                          setChangingHead(false)
                        }}
                      >
                        {isChangingHead ? 'Saving…' : 'Apply'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setChangingHead(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </Can>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    safeNavigate(navigate, {
                      to: projectRoutes.teamMembersPath,
                      params: { teamId: tid },
                    })
                  }
                >
                  View all
                </Button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewMembers.map((m) => (
                <div
                  key={m.id}
                  className="border border-outline-variant rounded-lg p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                    {m.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      {...looseLinkProps({
                        to: workforceRoutes.employeeDetailPath,
                        params: { employeeId: String(m.employmentId ?? m.id) },
                        className: 'font-semibold text-body-sm hover:text-secondary',
                      })}
                    >
                      {m.name}
                    </Link>
                    <p className="text-caption text-on-surface-variant">
                      {[m.role, m.code ? `Emp #${m.code}` : m.employmentId ? `Emp #${m.employmentId}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="text-caption text-on-surface-variant">
                      Joined {m.joined ?? '—'}
                      {m.department ? ` · ${m.department}` : ''}
                    </p>
                  </div>
                  <Can action="DELETE" resource="project">
                    <RemoveMemberButton
                      memberName={m.name}
                      employmentId={m.employmentId}
                      disabled={isRemoving}
                      isRemoving={isRemoving}
                      onRemove={(empId) => removeMember(empId)}
                    />
                  </Can>
                </div>
              ))}
              {previewMembers.length === 0 && (
                <p className="text-body-sm text-on-surface-variant col-span-full">
                  No active members yet — add members to this team.
                </p>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div className="bv-surface overflow-hidden">
              <div className="p-5 border-b border-outline-variant">
                <h2 className="text-headline-md font-semibold flex items-center gap-2">
                  <Icon name="history" className="text-secondary" /> Member History
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Previous members are kept as a record. Re-adding creates a new entry.
                </p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {history.map((m) => (
                  <div
                    key={m.id}
                    className="border border-outline-variant/60 rounded-lg p-4 flex items-start gap-3 opacity-80"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-body-sm">{m.name}</p>
                      <p className="text-caption text-on-surface-variant">
                        {[m.role, m.code ? `Emp #${m.code}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="text-caption text-on-surface-variant">
                        {m.joined ?? '—'} → {m.leftDate ?? '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bv-surface p-5">
            <div className="flex justify-between mb-4">
              <h2 className="text-headline-md font-semibold flex items-center gap-2">
                <Icon name="account_tree" className="text-secondary" /> Active Projects
              </h2>
              <button
                type="button"
                className="text-secondary text-label-md font-bold"
                onClick={() =>
                  safeNavigate(navigate, {
                    to: projectRoutes.teamProjectsPath,
                    params: { teamId: tid },
                  })
                }
              >
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
                    className: 'block border border-outline-variant rounded-lg p-4 hover:border-secondary transition-colors',
                  })}
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-body-sm text-on-surface-variant">Client: {p.client}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-surface-variant text-secondary text-label-sm">Due: {p.due}</span>
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
              <Icon name="history" className="text-secondary" /> Summary
            </h2>
            <div className="space-y-4 border-l-2 border-surface-variant ml-2 pl-4">
              <div>
                <p className="text-body-sm font-medium">{members.length} member{members.length === 1 ? '' : 's'}</p>
                <p className="text-caption text-on-surface-variant">Synced</p>
              </div>
              <div>
                <p className="text-body-sm font-medium">{projects.length} project{projects.length === 1 ? '' : 's'} linked</p>
                <p className="text-caption text-on-surface-variant">Synced</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
