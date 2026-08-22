import { Link, useParams, useSearch, useRouterState, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { useTeamDetail } from '../hooks/use-team-detail'
import type { TeamStatus } from '../types'
import { cn } from '@/shared/lib/cn'

export function TeamDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { teamId?: string }
  const search = useSearch({ strict: false }) as { edit?: string }
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const teamsListTo = pathname.startsWith('/workforce') ? '/workforce/teams' : '/projects/teams'
  const id = Number(params.teamId)

  const {
    team,
    isLoading,
    isError,
    refetch,
    isEditing,
    draft,
    setDraft,
    startEditing,
    cancelEdit,
    save,
    isSaving,
    members,
    addMemberOpen,
    setAddMemberOpen,
    availableOpts,
    picked,
    setPicked,
    addMember,
    removeMember,
    recentProjects,
    statusOptions,
  } = useTeamDetail(Number.isFinite(id) ? id : undefined)

  useEffect(() => {
    if (search.edit === '1' && team && !isEditing) startEditing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.edit, team?.id])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !team) {
    return (
      <div className="text-center py-16">
        <p className="text-body-md text-error mb-3">Team not found.</p>
        <Link to={teamsListTo}>
          <Button variant="outline">Back to Teams</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isEditing ? draft.name || team.name : team.name}
        description={team.department ?? 'Team'}
        showBack
        backTo={teamsListTo}
        backLabel="Back to teams"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={teamsListTo} className="hover:text-secondary">
              Teams
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{team.name}</span>
          </nav>
        }
        actions={
          isEditing ? (
            <div className="flex gap-2 flex-wrap">
              {/* Single Add member control — header only while editing */}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">person_add</span>}
                onClick={() => setAddMemberOpen(true)}
              >
                Add member
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => void save()} isLoading={isSaving}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <RefreshButton iconOnly onClick={() => refetch()} />
              <EditButton onClick={startEditing} label="Edit Team" />
            </div>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={String(members.length || team.memberCount)} icon="group" tone="bg-secondary/10 text-secondary" />
        <StatCard label="Projects" value={String(team.projectCount)} icon="account_tree" tone="bg-purple-100 text-purple-700" />
        <StatCard label="Status" value={team.status} icon="check_circle" tone="bg-emerald-100 text-emerald-700" />
        <StatCard
          label="Created"
          value={new Date(team.createdAt).toLocaleDateString()}
          icon="calendar_today"
          tone="bg-surface-container text-on-surface-variant"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-md font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">flag</span>
              Team Mission / Details
            </h3>
            {isEditing ? (
              <div className="space-y-4">
                <FieldInput label="Name" id="team-name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="team-desc">
                    Description
                  </label>
                  <textarea
                    id="team-desc"
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  />
                </div>
                <FieldInput label="Department" id="team-dept" value={draft.department} onChange={(v) => setDraft((d) => ({ ...d, department: v }))} />
                <FieldInput label="Head name" id="team-head" value={draft.headName} onChange={(v) => setDraft((d) => ({ ...d, headName: v }))} />
                <FieldInput label="Head role" id="team-role" value={draft.headRole} onChange={(v) => setDraft((d) => ({ ...d, headRole: v }))} />
                <Select
                  label="Status"
                  value={draft.status}
                  onChange={(v) => setDraft((d) => ({ ...d, status: v as TeamStatus }))}
                  options={statusOptions}
                />
              </div>
            ) : (
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {team.description || 'No description.'}
              </p>
            )}
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-md font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">groups</span>
              Team members ({members.length})
            </h3>
            {/* No second Add member button here — only header control */}
            {members.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No members listed yet.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={`${m.employmentId}-${m.name}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-outline-variant hover:border-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                        {m.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface flex items-center gap-1">
                          {m.name}
                          {m.isHead && (
                            <span className="material-symbols-outlined text-amber-500 text-[16px]">star</span>
                          )}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {m.role} · {m.code}
                        </p>
                      </div>
                    </div>
                    {isEditing && !m.isHead && (
                      <button
                        type="button"
                        className="p-2 text-on-surface-variant hover:text-error rounded-lg"
                        onClick={() => removeMember(m.employmentId)}
                        aria-label={`Remove ${m.name}`}
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bv-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-title-md font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">folder_open</span>
                Recent projects
              </h3>
              <Link to="/projects" className="text-sm font-semibold text-secondary hover:underline">
                View all
              </Link>
            </div>
            {recentProjects.length === 0 ? (
              <p className="p-5 text-sm text-on-surface-variant">No projects in sample data.</p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {recentProjects.map((p) => (
                  <li
                    key={p.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-surface-container-low cursor-pointer"
                    onClick={() =>
                      navigate({ to: '/projects/$projectId', params: { projectId: String(p.id) } })
                    }
                  >
                    <div>
                      <p className="font-medium text-sm text-on-surface">{p.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {p.code} · {p.clientName ?? '—'}
                      </p>
                    </div>
                    <span className="text-xs text-on-surface-variant">{p.progress ?? 0}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="w-full lg:w-[280px] shrink-0 bv-surface p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Overview</p>
          <OverviewRow label="Status" value={team.status} />
          <OverviewRow label="Department" value={team.department ?? '—'} />
          <OverviewRow label="Head" value={team.headName ?? 'Unassigned'} />
          <OverviewRow label="Role" value={team.headRole ?? '—'} />
          <OverviewRow label="Members" value={String(members.length || team.memberCount)} />
          <OverviewRow label="Projects" value={String(team.projectCount)} />
          <OverviewRow label="Created" value={new Date(team.createdAt).toLocaleDateString()} />
        </aside>
      </div>

      {addMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setAddMemberOpen(false)}
          />
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-title-lg font-semibold">Add team member</h3>
            <SearchableSelect
              label="Employee"
              options={availableOpts}
              value={picked}
              onChange={setPicked}
              placeholder="Search employees…"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={!picked} onClick={addMember}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: string
  tone: string
}) {
  return (
    <div className="bv-surface card-hover p-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', tone)}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-title-lg font-bold text-on-background">{value}</p>
    </div>
  )
}

function FieldInput({
  label,
  id,
  value,
  onChange,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => handleEnterAdvance(e)}
        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary"
      />
    </div>
  )
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-background font-medium text-right">{value}</span>
    </div>
  )
}
