import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useTeam } from '../hooks/use-teams'
import { cn } from '@/shared/lib/cn'

const CANDIDATES = [
  { id: 'c1', name: 'Alex Rivera', department: 'Engineering', years: 4, availability: 'Available' },
  { id: 'c2', name: 'Maya Patel', department: 'Design', years: 3, availability: 'Available' },
  { id: 'c3', name: 'Tom Peters', department: 'Engineering', years: 6, availability: 'Busy' },
]

export function ProjectTeamAddMemberPage() {
  const params = useParams({ strict: false }) as { teamId?: string }
  const navigate = useNavigate()
  const id = Number(params.teamId)
  const { data: team, isLoading } = useTeam(Number.isFinite(id) ? id : undefined)
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [toast, setToast] = useState(false)

  if (isLoading || !team) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Add Team Member"
        description={`Expand ${team.name} by onboarding company employees.`}
        showBack
        backTo={`/projects/teams/${team.id}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CANDIDATES.map((m) => (
          <div
            key={m.id}
            className="bv-surface card-hover p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  {m.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-title-md font-semibold">{m.name}</h3>
                  <p className="text-label-sm text-on-surface-variant">{m.department}</p>
                </div>
              </div>
              <span
                className={cn(
                  'px-2 py-1 rounded text-[10px] font-bold uppercase',
                  m.availability === 'Available'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700',
                )}
              >
                {m.availability}
              </span>
            </div>
            <p className="text-label-sm text-on-surface-variant mb-2">{m.years} years experience</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['Lead', 'Senior', 'Junior'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoles((prev) => ({ ...prev, [m.id]: r }))}
                  className={cn(
                    'flex-1 py-2 px-3 border rounded-lg text-label-md transition-all',
                    roles[m.id] === r
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              className="w-full"
              leftIcon={<span className="material-symbols-outlined">add_circle</span>}
              onClick={() => {
                setToast(true)
                setTimeout(() => setToast(false), 2500)
              }}
            >
              Add to Team
            </Button>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl executive-shadow flex items-center gap-3 z-50">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <div>
            <p className="font-bold text-sm">Member Added</p>
            <p className="text-xs opacity-80">Employee assigned to {team.name}.</p>
          </div>
        </div>
      )}
    </div>
  )
}
