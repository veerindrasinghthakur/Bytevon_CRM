import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useTasks } from '../hooks/use-tasks'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'

/** Same layout pattern as ProjectsListPage. */
export function TasksListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useTasks({
    search: search || undefined,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pending = items.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length
  const done = items.filter((t) => t.status === 'DONE').length
  const blocked = items.filter((t) => t.status === 'BLOCKED').length

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-background">
            Tasks
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Tasks are work items under projects across the organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
            onClick={() => console.info('Export tasks')}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/projects/tasks/new' })}
          >
            New Task
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <div className="flex items-center flex-1 min-w-[200px] max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-2 focus-within:border-electric-blue">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search task name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-background placeholder:text-on-surface-variant"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-background focus:outline-none focus:border-electric-blue cursor-pointer">
              <option>All Projects</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-background focus:outline-none focus:border-electric-blue cursor-pointer">
              <option>Priority: All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md text-on-background focus:outline-none focus:border-electric-blue cursor-pointer">
              <option>Status: All</option>
              <option>In Progress</option>
              <option>Pending</option>
              <option>Completed</option>
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
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            </div>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Total Tasks</p>
            <h3 className="text-[32px] font-bold text-on-background leading-none">{total || '—'}</h3>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </div>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Pending</p>
            <h3 className="text-[32px] font-bold text-on-background leading-none">{pending}</h3>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
            </div>
            {blocked > 0 && (
              <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">At risk</div>
            )}
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Blocked / Overdue</p>
            <h3 className="text-[32px] font-bold text-on-background leading-none">{blocked}</h3>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Completed</p>
            <h3 className="text-[32px] font-bold text-on-background leading-none">{done}</h3>
          </div>
        </div>
      </section>

      {isLoading && <TableSkeleton rows={5} />}
      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load tasks.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon="assignment"
          title="No tasks yet"
          description="Create a task from a project detail page or here."
          actionLabel="New Task"
          onAction={() => navigate({ to: '/projects/tasks/new' })}
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface/50">
                  <th className="py-4 px-6 w-12">
                    <input type="checkbox" className="rounded border-outline-variant w-4 h-4" />
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Task Name</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Project</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Assignee</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Priority</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Due Date</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.map((task) => (
                  <tr key={task.id} className="h-[72px]">
                    <td className="py-2 px-6">
                      <input type="checkbox" className="rounded border-outline-variant w-4 h-4" />
                    </td>
                    <td className="py-2 px-4">
                      <p
                        className={`text-body-md font-semibold ${
                          task.status === 'DONE' ? 'text-on-surface-variant line-through' : 'text-on-background'
                        }`}
                      >
                        {task.title}
                      </p>
                    </td>
                    <td className="py-2 px-4 text-body-md text-on-background">{task.projectName ?? '—'}</td>
                    <td className="py-2 px-4 text-body-md text-on-background">{task.assigneeName ?? '—'}</td>
                    <td className="py-2 px-4">
                      <TaskPriorityLabel priority={task.priority} />
                    </td>
                    <td className="py-2 px-4">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="py-2 px-4 text-body-md text-on-background">{task.dueDate ?? '—'}</td>
                    <td className="py-2 px-6 text-right">
                      <div className="flex justify-end">
                        <RowActions
                          label={`Actions for ${task.title}`}
                          actions={[
                            {
                              id: 'view',
                              label: 'View',
                              icon: 'description',
                              onClick: () => console.info('View task', task.id),
                            },
                            {
                              id: 'edit',
                              label: 'Edit',
                              icon: 'edit',
                              onClick: () => console.info('Edit task', task.id),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-outline-variant/30 p-4 flex items-center justify-between">
            <p className="text-[11px] text-on-surface-variant">
              Showing <span className="font-semibold text-on-background">1-{items.length}</span> of{' '}
              <span className="font-semibold text-on-background">{total}</span> Tasks
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
