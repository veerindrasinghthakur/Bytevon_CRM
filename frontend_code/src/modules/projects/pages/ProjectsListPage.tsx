import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { useProjects } from '../hooks/use-projects'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'

export function ProjectsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useProjects({
    search: search || undefined,
  })

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage all projects, teams and tasks."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/projects/new' })}
          >
            New Project
          </Button>
        }
      />

      {/* Page-level search (Header search collapses to icon on list pages) */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center flex-1 max-w-sm bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant focus-within:border-electric-blue focus-within:border-2 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">
            search
          </span>
          <input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
      </div>

      {isLoading && <TableSkeleton rows={5} />}

      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load projects.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState
          icon="folder_off"
          title="No projects yet"
          description="Create your first project to get started."
          actionLabel="New Project"
          onAction={() => navigate({ to: '/projects/new' })}
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="px-4 py-3 text-label-sm text-on-surface-variant font-semibold">Name</th>
                <th className="px-4 py-3 text-label-sm text-on-surface-variant font-semibold">Status</th>
                <th className="px-4 py-3 text-label-sm text-on-surface-variant font-semibold hidden md:table-cell">Client</th>
                <th className="px-4 py-3 text-label-sm text-on-surface-variant font-semibold hidden lg:table-cell">Progress</th>
                <th className="px-4 py-3 text-label-sm text-on-surface-variant font-semibold hidden sm:table-cell">Tasks</th>
                <th className="px-4 py-3 text-label-sm text-on-surface-variant font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: String(project.id) }}
                      className="font-medium text-on-background hover:text-electric-blue"
                    >
                      {project.name}
                    </Link>
                    {project.code && (
                      <span className="block text-body-sm text-on-surface-variant">{project.code}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant hidden md:table-cell">
                    {project.clientName ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-electric-blue"
                          style={{ width: `${project.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-body-sm text-on-surface-variant">{project.progress ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant hidden sm:table-cell">
                    {project.taskCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: String(project.id) }}
                      className="text-on-surface-variant hover:text-electric-blue"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}