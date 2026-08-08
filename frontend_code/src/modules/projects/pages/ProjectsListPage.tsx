import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useProjects } from '../hooks/use-projects'
import type { ProjectStatus } from '../schemas/project'

function PriorityBadge({ status }: { status: ProjectStatus }) {
  if (status === 'IN_PROGRESS') {
    return (
      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
        Critical
      </span>
    )
  }
  if (status === 'ON_HOLD') {
    return (
      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
        High
      </span>
    )
  }
  return (
    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
      Medium
    </span>
  )
}

function statusTrackLabel(status: ProjectStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'On Track' }
    case 'PLANNING':
      return { dot: 'bg-blue-500', text: 'text-blue-700', label: 'Planning' }
    case 'ON_HOLD':
      return { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Delayed' }
    case 'COMPLETED':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Completed' }
    default:
      return { dot: 'bg-gray-400', text: 'text-on-surface-variant', label: status }
  }
}

/** Nav list page — no breadcrumbs / back (only nested pages show path + back). */
export function ProjectsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useProjects({
    search: search || undefined,
  })

  const total = data?.total ?? 0
  const active = data?.items.filter((p) => p.status === 'IN_PROGRESS').length ?? 0
  const atRisk = data?.items.filter((p) => p.status === 'ON_HOLD').length ?? 0

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-surface">
            Project Management
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage projects, assign teams, track milestones and monitor budget burn rates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">upload</span>}
            onClick={() => console.info('Import projects')}
          >
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
            onClick={() => console.info('Export projects')}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/projects/new' })}
          >
            New Project
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <div className="flex items-center flex-1 min-w-[200px] max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-2 focus-within:border-electric-blue">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search by Project Name, Client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-surface focus:outline-none focus:border-electric-blue cursor-pointer">
              <option>Project Status</option>
              <option>Active</option>
              <option>On Hold</option>
              <option>Completed</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-surface focus:outline-none focus:border-electric-blue cursor-pointer">
              <option>Current Phase</option>
              <option>Planning</option>
              <option>Execution</option>
              <option>Review</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-surface focus:outline-none focus:border-electric-blue cursor-pointer">
              <option>Priority Level</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface-variant hover:text-electric-blue"
            aria-label="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-electric-blue/10 flex items-center justify-center text-electric-blue">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
            </div>
            <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">+12%</div>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Total Projects</p>
            <h3 className="text-[32px] font-bold text-on-surface leading-none">{total || '—'}</h3>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">+4.2%</div>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Active Projects</p>
            <h3 className="text-[32px] font-bold text-on-surface leading-none">{active}</h3>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">-2.1%</div>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">At Risk / Delayed</p>
            <h3 className="text-[32px] font-bold text-on-surface leading-none">{atRisk}</h3>
          </div>
        </div>
        <div className="bg-deep-navy border border-white/10 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            </div>
          </div>
          <div>
            <p className="text-label-sm text-white/70 mb-1">Total Managed Budget</p>
            <h3 className="text-[32px] font-bold text-white leading-none">$12.4M</h3>
          </div>
        </div>
      </section>

      {isLoading && <TableSkeleton rows={5} />}
      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load projects.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
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
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface/50">
                  <th className="py-4 px-6 w-12">
                    <input type="checkbox" className="rounded border-outline-variant w-4 h-4" />
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Proj ID</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Project Name</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Client</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Priority & Status</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Progress</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.items.map((project) => {
                  const track = statusTrackLabel(project.status)
                  const initials = project.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                  return (
                    <tr key={project.id} className="h-[72px]">
                      <td className="py-2 px-6">
                        <input type="checkbox" className="rounded border-outline-variant w-4 h-4" />
                      </td>
                      <td className="py-2 px-4 text-[11px] text-on-surface-variant">#{project.code}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {initials}
                          </div>
                          <div>
                            <p className="text-body-md font-semibold text-on-surface">{project.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{project.taskCount ?? 0} tasks</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <p className="text-body-md font-semibold text-on-surface">{project.clientName ?? '—'}</p>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <PriorityBadge status={project.status} />
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${track.dot}`} />
                            <span className={`text-[11px] font-medium ${track.text}`}>{track.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-surface-container-high overflow-hidden">
                            <div
                              className="h-full rounded-full bg-electric-blue"
                              style={{ width: `${project.progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-body-sm text-on-surface-variant">{project.progress ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-6 text-right">
                        <div className="flex justify-end">
                          <RowActions
                            label={`Actions for ${project.name}`}
                            actions={[
                              {
                                id: 'details',
                                label: 'View details',
                                icon: 'description',
                                onClick: () =>
                                  navigate({
                                    to: '/projects/$projectId',
                                    params: { projectId: String(project.id) },
                                  }),
                              },
                              {
                                id: 'edit',
                                label: 'Edit',
                                icon: 'edit',
                                onClick: () => console.info('Edit project', project.id),
                              },
                              {
                                id: 'archive',
                                label: 'Archive',
                                icon: 'archive',
                                danger: true,
                                onClick: () => console.info('Archive project', project.id),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-outline-variant/30 p-4 flex items-center justify-between">
            <p className="text-[11px] text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">1-{data.items.length}</span> of{' '}
              <span className="font-semibold text-on-surface">{data.total}</span> Projects
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
