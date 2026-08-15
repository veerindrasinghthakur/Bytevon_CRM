import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { TeamRow } from '../types'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

type Tab = 'overview' | 'members' | 'projects'

/** Shared header + metrics + tabs for team Overview / Members / Project History */
export function TeamTopView({
  team,
  activeTab,
}: {
  team: TeamRow
  activeTab: Tab
}) {
  const navigate = useNavigate()
  const t = team

  const tabs: { id: Tab; label: string; to: string }[] = [
    { id: 'overview', label: 'Overview', to: `/workforce/teams/${t.id}` },
    { id: 'members', label: 'Members', to: `/workforce/teams/${t.id}/members` },
    { id: 'projects', label: 'Project History', to: `/workforce/teams/${t.id}/projects` },
  ]

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-headline-xl font-bold">{t.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-variant text-secondary text-label-sm font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active
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
            leftIcon={<Icon name="edit" />}
            onClick={() => navigate({ to: '/workforce/teams/$teamId/edit', params: { teamId: t.id } })}
          >
            Edit Team
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon name="person_add" />}
            onClick={() =>
              navigate({ to: '/workforce/teams/$teamId/add-member', params: { teamId: t.id } })
            }
          >
            Add Member
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon name="assignment_add" />}
            onClick={() =>
              navigate({ to: '/workforce/teams/$teamId/assign-project', params: { teamId: t.id } })
            }
          >
            Assign to Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Total Members', value: `${t.memberCount} Members`, icon: 'group', change: '12%' },
          {
            label: 'Projects Delivered',
            value: `${t.projectCount * 6} Projects`,
            icon: 'check_circle',
            change: '4%',
          },
          { label: 'Current Velocity', value: `${t.velocity ?? 94}%`, icon: 'speed', change: '2%' },
          { label: 'Avg. Task Completion', value: '4.2 Days', icon: 'timer' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm"
          >
            <div className="flex justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low text-secondary flex items-center justify-center">
                <Icon name={s.icon} />
              </div>
              {s.change && (
                <span className="text-emerald-600 text-label-sm bg-emerald-50 px-2 py-0.5 rounded">
                  ↑ {s.change}
                </span>
              )}
            </div>
            <p className="text-body-md text-on-surface-variant">{s.label}</p>
            <p className="text-headline-xl font-bold">{s.value}</p>
          </div>
        ))}
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
