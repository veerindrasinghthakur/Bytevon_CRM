import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { projectRoutes } from '../../routes'
import type { TeamUi } from '../../hooks/team/use-team-detail'

const TEAM_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'projects', label: 'Project History' },
] as const

const TEAM_METRICS = [
  { id: 'members', label: 'Total Members', icon: 'group' },
  { id: 'projects', label: 'Projects', icon: 'check_circle' },
  { id: 'status', label: 'Status', icon: 'toggle_on' },
  { id: 'dept', label: 'Department', icon: 'domain' },
] as const

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function TeamTopView({
  team,
  activeTab,
  onDelete,
  isDeleting,
}: {
  team: TeamUi
  activeTab: 'overview' | 'members' | 'projects'
  onDelete?: () => void
  isDeleting?: boolean
}) {
  const navigate = useNavigate()
  const t = team
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tabs = TEAM_TABS.map((tab) => ({
    ...tab,
    to:
      tab.id === 'overview'
        ? projectRoutes.teamDetail(t.id)
        : tab.id === 'members'
          ? projectRoutes.teamMembers(t.id)
          : projectRoutes.teamProjects(t.id),
  }))

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-headline-xl font-bold">{t.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-variant text-secondary text-label-sm font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {t.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-body-md text-on-surface-variant">
            {t.createdOn && (
              <span className="flex items-center gap-1">
                <Icon name="calendar_today" className="text-lg" /> Created on {t.createdOn}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="domain" className="text-lg" /> Department: {t.department}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="person" className="text-lg" /> Lead: {t.headName}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            leftIcon={<Icon name="person_add" />}
            onClick={() =>
              safeNavigate(navigate, {
                to: projectRoutes.teamAddMemberPath,
                params: { teamId: t.id },
              })
            }
          >
            Add Member
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon name="assignment_add" />}
            onClick={() =>
              safeNavigate(navigate, {
                to: projectRoutes.teamAssignProjectPath,
                params: { teamId: t.id },
              })
            }
          >
            Assign Project
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon name="edit" />}
            onClick={() =>
              safeNavigate(navigate, {
                to: projectRoutes.teamEditPath,
                params: { teamId: t.id },
              })
            }
          >
            Edit
          </Button>
          {onDelete &&
            (!confirmDelete ? (
              <Button variant="outline" leftIcon={<Icon name="delete" />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 text-body-sm">
                <span className="text-on-surface-variant">Delete this team?</span>
                <Button variant="outline" size="sm" disabled={isDeleting} onClick={onDelete}>
                  {isDeleting ? 'Deleting…' : 'Confirm'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </span>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {TEAM_METRICS.map((s) => {
          const value =
            s.id === 'members'
              ? String(t.memberCount)
              : s.id === 'projects'
                ? String(t.projectCount)
                : s.id === 'status'
                  ? t.status
                  : t.department
          return (
            <div
              key={s.label}
              className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm"
            >
              <div className="flex justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low text-secondary flex items-center justify-center">
                  <Icon name={s.icon} />
                </div>
              </div>
              <p className="text-body-md text-on-surface-variant">{s.label}</p>
              <p className="text-headline-xl font-bold">{value}</p>
            </div>
          )
        })}
      </div>

      <div className="border-b border-outline-variant flex gap-6 mt-6">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.to}
            className={cn(
              'pb-3 text-label-md font-bold border-b-2',
              activeTab === tab.id
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-background',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </>
  )
}
