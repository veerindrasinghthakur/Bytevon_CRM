import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { teams } from '../data/mock'
import { membersFor } from '../data/teamExtraMock'
import { RouteCrumbs } from '../components/RouteCrumbs'
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
  const t = teams.find((x) => x.id === teamId) ?? teams[0]
  const [query, setQuery] = useState('')
  const members = membersFor(t.id)
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return members.filter((m) => !q || m.name.toLowerCase().includes(q) || m.title.toLowerCase().includes(q))
  }, [members, query])

  return (
    <div className="space-y-6">
      <div>
        <BackButton to={`/workforce/teams/${t.id}`} label="Back to team" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: '/workforce/employees' },
            { label: 'Teams', to: '/workforce/teams' },
            { label: t.name, to: `/workforce/teams/${t.id}` },
            { label: 'Members' },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-headline-xl font-bold">{t.name} — Members</h1>
            <p className="text-body-md text-on-surface-variant">{members.length} people on this team</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Icon name="person_add" />}
            onClick={() => navigate({ to: '/workforce/teams/$teamId/add-member', params: { teamId: t.id } })}
          >
            Add member
          </Button>
        </div>
      </div>

      <div className="border-b border-outline-variant flex gap-6">
        {[
          { label: 'Overview', to: `/workforce/teams/${t.id}` },
          { label: 'Members', to: `/workforce/teams/${t.id}/members`, active: true },
          { label: 'Project History', to: `/workforce/teams/${t.id}/projects` },
        ].map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            className={cn(
              'pb-3 text-label-md font-bold border-b-2',
              tab.active ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <div className="relative max-w-sm">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm"
              placeholder="Search members…"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant">
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Member</th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden md:table-cell">Role</th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">Joined</th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-surface-container-low/40">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                      {m.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-body-sm">{m.name}</p>
                      <p className="text-caption text-on-surface-variant">{m.title}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-sm hidden md:table-cell">{m.role}</td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant hidden sm:table-cell">{m.joined}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                    )}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
