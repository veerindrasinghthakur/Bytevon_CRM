import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearch, useRouterState } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { useTeam, useUpdateTeam } from '../hooks/use-teams'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import type { TeamStatus } from '../api/teams'
import { listEmployments } from '@/modules/workforce/api/employment'
import { cn } from '@/shared/lib/cn'

interface TeamMember {
  employmentId: number
  name: string
  code: string
  role: string
  isHead?: boolean
}

export function TeamDetailPage() {
  const params = useParams({ strict: false }) as { teamId?: string }
  const search = useSearch({ strict: false }) as { edit?: string }
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const teamsListTo = pathname.startsWith('/workforce') ? '/workforce/teams' : '/projects/teams'
  const id = Number(params.teamId)
  const { data: team, isLoading, isError, refetch } = useTeam(
    Number.isFinite(id) ? id : undefined,
  )
  const updateMutation = useUpdateTeam()

  const [editing, setEditing] = useState(search.edit === '1')
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    department: '',
    headName: '',
    headRole: '',
    status: 'ACTIVE' as TeamStatus,
  })
  const [members, setMembers] = useState<TeamMember[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [empOptions, setEmpOptions] = useState<{ value: string; label: string; meta?: string }[]>([])
  const [picked, setPicked] = useState('')

  useEffect(() => {
    if (team) {
      setDraft({
        name: team.name,
        description: team.description ?? '',
        department: team.department ?? '',
        headName: team.headName ?? '',
        headRole: team.headRole ?? '',
        status: team.status,
      })
      setEditing(search.edit === '1')
      // Seed members from head + directory sample for demo realism
      void listEmployments({}).then((res) => {
        const opts = res.items.map((e) => ({
          value: String(e.id),
          label: `${e.fullName} (${e.employee_code})`,
          meta: e.departmentName,
        }))
        setEmpOptions(opts)
        const seed: TeamMember[] = []
        if (team.headName) {
          const head = res.items.find((e) => e.fullName === team.headName)
          seed.push({
            employmentId: head?.id ?? 0,
            name: team.headName,
            code: head?.employee_code ?? '—',
            role: team.headRole ?? 'Team Lead',
            isHead: true,
          })
        }
        const others = res.items
          .filter((e) => e.fullName !== team.headName)
          .slice(0, Math.max(0, Math.min(team.memberCount - seed.length, 5)))
          .map((e) => ({
            employmentId: e.id,
            name: e.fullName,
            code: e.employee_code,
            role: e.positionName,
          }))
        setMembers([...seed, ...others])
      })
    }
  }, [team, search.edit])

  const memberIds = useMemo(() => new Set(members.map((m) => String(m.employmentId))), [members])
  const availableOpts = empOptions.filter((o) => !memberIds.has(o.value))

  const addMember = () => {
    if (!picked) return
    const opt = empOptions.find((o) => o.value === picked)
    if (!opt) return
    setMembers((prev) => [
      ...prev,
      {
        employmentId: Number(picked),
        name: opt.label.replace(/ \(.*\)$/, ''),
        code: opt.label.match(/\(([^)]+)\)/)?.[1] ?? '—',
        role: opt.meta ?? 'Member',
      },
    ])
    setPicked('')
    setPickerOpen(false)
  }

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

  const startEdit = () => setEditing(true)
  const cancelEdit = () => {
    setDraft({
      name: team.name,
      description: team.description ?? '',
      department: team.department ?? '',
      headName: team.headName ?? '',
      headRole: team.headRole ?? '',
      status: team.status,
    })
    setEditing(false)
  }

  const saveEdit = async () => {
    await updateMutation.mutateAsync({
      id: team.id,
      patch: {
        name: draft.name,
        description: draft.description,
        department: draft.department,
        headName: draft.headName || undefined,
        headRole: draft.headRole || undefined,
        status: draft.status,
      },
    })
    setEditing(false)
    void refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? draft.name || team.name : team.name}
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
          editing ? (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                Add member
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void saveEdit()}
                isLoading={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
              onClick={startEdit}
            >
              Edit Team
            </Button>
          )
        }
      />

      {/* Stats row — aligned with team_detail HTML */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={String(members.length || team.memberCount)} icon="group" />
        <StatCard label="Projects" value={String(team.projectCount)} icon="account_tree" />
        <StatCard label="Status" value={team.status} icon="check_circle" />
        <StatCard
          label="Created"
          value={new Date(team.createdAt).toLocaleDateString()}
          icon="calendar_today"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-title-lg text-on-background mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">flag</span>
              Team Mission / Details
            </h3>
            {editing ? (
              <div className="space-y-4">
                <FieldInput
                  label="Name"
                  id="team-name"
                  value={draft.name}
                  onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
                />
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
                <FieldInput
                  label="Department"
                  id="team-dept"
                  value={draft.department}
                  onChange={(v) => setDraft((d) => ({ ...d, department: v }))}
                />
                <FieldInput
                  label="Head name"
                  id="team-head"
                  value={draft.headName}
                  onChange={(v) => setDraft((d) => ({ ...d, headName: v }))}
                />
                <FieldInput
                  label="Head role"
                  id="team-role"
                  value={draft.headRole}
                  onChange={(v) => setDraft((d) => ({ ...d, headRole: v }))}
                />
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="team-status">
                    Status
                  </label>
                  <select
                    id="team-status"
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as TeamStatus }))}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {team.description || 'No description.'}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-lg text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">groups</span>
                Team members ({members.length})
              </h3>
              {editing && (
                <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  Add member
                </Button>
              )}
            </div>
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
                    {editing && !m.isHead && (
                      <button
                        type="button"
                        className="p-2 text-on-surface-variant hover:text-error rounded-lg"
                        onClick={() =>
                          setMembers((prev) => prev.filter((x) => x.employmentId !== m.employmentId))
                        }
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="w-full lg:w-[280px] shrink-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 space-y-4 shadow-sm">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Overview</p>
          <OverviewRow label="Status" value={team.status} />
          <OverviewRow label="Department" value={team.department ?? '—'} />
          <OverviewRow label="Head" value={team.headName ?? 'Unassigned'} />
          <OverviewRow label="Role" value={team.headRole ?? '—'} />
          <OverviewRow label="Members" value={String(members.length || team.memberCount)} />
          <OverviewRow label="Projects" value={String(team.projectCount)} />
          <OverviewRow label="Created" value={new Date(team.createdAt).toLocaleDateString()} />
        </aside>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setPickerOpen(false)}
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
              <Button variant="ghost" onClick={() => setPickerOpen(false)}>
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

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm card-hover">
      <div className="flex justify-between items-start mb-2">
        <span className="material-symbols-outlined text-secondary text-xl">{icon}</span>
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
