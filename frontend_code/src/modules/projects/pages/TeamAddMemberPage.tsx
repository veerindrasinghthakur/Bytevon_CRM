import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { useTeam } from '../hooks/use-teams'
import { getTeamCandidates } from '../api/teams'
import { cn } from '@/shared/lib/cn'
import { projectRoutes } from '../routes'
import { teamMemberFormSchema } from '../schemas/team-member-form'
import type { TeamMemberFormValues } from '../types'

export function TeamAddMemberPage() {
  const params = useParams({ strict: false }) as { teamId?: string }
  const id = Number(params.teamId)
  const { data: team, isLoading } = useTeam(Number.isFinite(id) ? id : undefined)
  const [toast, setToast] = useState(false)

  const {
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: { roles: [] },
  })

  const { data: candidates, isLoading: isCandidatesLoading } = useQuery({
    queryKey: ['teams', id, 'candidates'],
    queryFn: () => getTeamCandidates(id),
    enabled: Number.isFinite(id) && !!team,
  })

  const roles = watch('roles') as TeamMemberFormValues['roles']

  const getRole = (candidateId: string): TeamMemberFormValues['roles'][number]['role'] | undefined => {
    return roles.find((r) => r.candidateId === candidateId)?.role
  }

  const setRole = (
    candidateId: string,
    role: TeamMemberFormValues['roles'][number]['role'],
  ) => {
    const existing = roles.findIndex((r) => r.candidateId === candidateId)
    if (existing >= 0) {
      const updated = [...roles]
      updated[existing] = { candidateId, role }
      setValue('roles', updated)
    } else {
      setValue('roles', [...roles, { candidateId, role }])
    }
  }

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
        backTo={projectRoutes.teamDetail(team.id)}
        backLabel="Back to team"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isCandidatesLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bv-surface card-hover p-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-3 w-24 mt-1" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            ))
          : candidates?.map((m) => {
              const selectedRole = getRole(m.id)
              return (
                <div key={m.id} className="bv-surface card-hover p-6">
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
                          ? 'bg-success-container text-on-success'
                          : 'bg-warning-container text-on-warning',
                      )}
                    >
                      {m.availability}
                    </span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant mb-2">{m.years} years experience</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(['Lead', 'Senior', 'Junior'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(m.id, r)}
                        className={cn(
                          'flex-1 py-2 px-3 border rounded-lg text-label-md transition-all',
                          selectedRole === r
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
                    disabled={isSubmitting}
                  >
                    Add to Team
                  </Button>
                </div>
              )
            })}
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

/** Alias kept for any residual named imports */
export { TeamAddMemberPage as ProjectTeamAddMemberPage }
