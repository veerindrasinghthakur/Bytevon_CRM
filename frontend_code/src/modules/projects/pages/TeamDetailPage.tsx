import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useTeam, useUpdateTeam } from '../hooks/use-teams'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import type { TeamStatus } from '../api/teams'

export function TeamDetailPage() {
  const params = useParams({ strict: false }) as { teamId?: string }
  const search = useSearch({ strict: false }) as { edit?: string }
  const navigate = useNavigate()
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
    }
  }, [team, search.edit])

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
        <Link to="/projects/teams">
          <Button variant="outline">Back</Button>
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

  const teamIdStr = String(team.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? draft.name || team.name : team.name}
        description={team.department ?? 'Team'}
        showBack
        backTo="/projects/teams"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects/teams" className="hover:text-electric-blue">
              Teams
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{team.name}</span>
          </nav>
        }
        actions={
          editing ? (
            <div className="flex gap-2">
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">group</span>}
                onClick={() =>
                  navigate({
                    to: '/projects/teams/$teamId/members',
                    params: { teamId: teamIdStr },
                  })
                }
              >
                Members
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">person_add</span>}
                onClick={() =>
                  navigate({
                    to: '/projects/teams/$teamId/add-member',
                    params: { teamId: teamIdStr },
                  })
                }
              >
                Add Member
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
                onClick={startEdit}
              >
                Edit
              </Button>
            </div>
          )
        }
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
            <h3 className="text-title-lg text-on-background mb-4">Details</h3>
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
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue resize-none"
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
                  <label
                    className="text-label-sm text-on-surface-variant block mb-1"
                    htmlFor="team-status"
                  >
                    Status
                  </label>
                  <select
                    id="team-status"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, status: e.target.value as TeamStatus }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-body-md text-on-surface-variant">
                {team.description || 'No description.'}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-lg text-on-background">Team actions</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                leftIcon={<span className="material-symbols-outlined">person_add</span>}
                onClick={() =>
                  navigate({
                    to: '/projects/teams/$teamId/add-member',
                    params: { teamId: teamIdStr },
                  })
                }
              >
                Add Member
              </Button>
              <Button
                variant="outline"
                leftIcon={<span className="material-symbols-outlined">groups</span>}
                onClick={() =>
                  navigate({
                    to: '/projects/teams/$teamId/members',
                    params: { teamId: teamIdStr },
                  })
                }
              >
                View Members ({team.memberCount})
              </Button>
            </div>
          </section>
        </div>

        <aside className="w-full lg:w-[280px] shrink-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 space-y-4 shadow-subtle">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Overview</p>
          <OverviewRow label="Status" value={team.status} />
          <OverviewRow label="Department" value={team.department ?? '—'} />
          <OverviewRow label="Head" value={team.headName ?? 'Unassigned'} />
          <OverviewRow label="Role" value={team.headRole ?? '—'} />
          <OverviewRow label="Members" value={String(team.memberCount)} />
          <OverviewRow label="Projects" value={String(team.projectCount)} />
          <OverviewRow label="Created" value={new Date(team.createdAt).toLocaleDateString()} />
        </aside>
      </div>
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
        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue"
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
