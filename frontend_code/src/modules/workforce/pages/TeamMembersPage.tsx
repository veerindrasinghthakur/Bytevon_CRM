import { useMemo, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { teams } from '../data/mock'
import { membersFor } from '../data/teamExtraMock'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { TeamTopView } from '../components/TeamTopView'
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
  const t = teams.find((x) => x.id === teamId) ?? teams[0]
  const [query, setQuery] = useState('')
  const members = membersFor(t.id)
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return members.filter(
      (m) => !q || m.name.toLowerCase().includes(q) || m.title.toLowerCase().includes(q),
    )
  }, [members, query])

  return (
    <div className="space-y-6">
      <div>
        <BackButton to={`/workforce/teams/${t.id}`} label="Back to team" />
        <DynamicRouteCrumbs
          className="mt-2 mb-2"
          lastLabel="Members"
          labelOverrides={{ [t.id]: t.name }}
        />
        <TeamTopView team={t} activeTab="members" />
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
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden md:table-cell">
                Role
              </th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">
                Joined
              </th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-surface-container-low/40">
                <td className="px-6 py-4">
                  <Link
                    to="/workforce/employees/$employeeId"
                    params={{ employeeId: m.id }}
                    className="flex items-center gap-3 hover:opacity-90"
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
