import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { useTeams } from '../hooks/use-teams'
import { cn } from '@/shared/lib/cn'

export function TeamsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useTeams({
    search: search || undefined,
  })

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Project teams and members."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/projects/teams/new' })}
          >
            New Team
          </Button>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center flex-1 max-w-sm bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant focus-within:border-electric-blue focus-within:border-2 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
      </div>

      {isLoading && <TableSkeleton rows={4} />}

      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load teams.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState
          icon="groups"
          title="No teams yet"
          description="Create your first team to start organizing project members."
          actionLabel="New Team"
          onAction={() => navigate({ to: '/projects/teams/new' })}
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((team) => (
            <article
              key={team.id}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 hover:border-electric-blue/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-deep-navy/5 border border-deep-navy/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-deep-navy">groups</span>
                </div>
                <span
                  className={cn(
                    'text-label-sm px-2 py-0.5 rounded-full font-medium',
                    team.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  {team.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-title-lg text-on-background mb-1">{team.name}</h3>
              {team.projectName && (
                <p className="text-body-sm text-electric-blue mb-2">{team.projectName}</p>
              )}
              {team.description && (
                <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-4">
                  {team.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-base">person</span>
                {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
