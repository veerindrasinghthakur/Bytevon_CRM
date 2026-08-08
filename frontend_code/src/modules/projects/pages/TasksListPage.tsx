import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useTasks } from '../hooks/use-tasks'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'

/** Nav list page — search left, filters right. No breadcrumbs. */
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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-surface mb-1">Tasks</h2>
          <p className="text-body-md text-on-surface-variant">
            Tasks are work items under projects across the organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-sm">download</span>}
            onClick={() => console.info('Export tasks')}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
            onClick={() => navigate({ to: '/projects/tasks/new' })}
          >
            New Task
          </Button>
        </div>
      </div>

      <section className="flex flex-wrap items-center gap-4">
        <div className="flex items-center flex-1 min-w-[200px] max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-2 focus-within:border-electric-blue">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search task name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md cursor-pointer">
              <option>All Projects</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
          <div className="relative min-w-[140px]">
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md cursor-pointer">
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
            <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-2 pl-4 pr-10 text-body-md cursor-pointer">
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
            className="p-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface-variant"
            aria-label="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Tasks</p>
          <h3 className="text-[32px] font-bold text-on-surface">{total}</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Pending</p>
          <h3 className="text-[32px] font-bold text-on-surface">{pending}</h3>
        </div>
        <div className="bg-error/10 border border-error/20 rounded-xl p-5 shadow-sm">
          <p className="text-label-sm text-error mb-1 uppercase tracking-wider">Blocked / Overdue</p>
          <h3 className="text-[32px] font-bold text-error">{blocked}</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Completed</p>
          <h3 className="text-[32px] font-bold text-on-surface">{done}</h3>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading && (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        )}
        {isError && (
          <div className="p-6 text-center">
            <p className="text-body-md text-error mb-3">Failed to load tasks.</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon="assignment"
              title="No tasks yet"
              description="Create a task from a project detail page or here."
              actionLabel="New Task"
              onAction={() => navigate({ to: '/projects/tasks/new' })}
            />
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-outline-variant">
                    <th className="pl-6 pr-4 py-3 w-12">
                      <input type="checkbox" className="rounded border-outline-variant" />
                    </th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Task Name</th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Assignee</th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {items.map((task) => (
                    <tr key={task.id} className="h-[72px]">
                      <td className="pl-6 pr-4 py-3">
                        <input type="checkbox" className="rounded border-outline-variant" />
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`text-body-md font-semibold ${
                            task.status === 'DONE' ? 'text-on-surface-variant line-through' : 'text-on-surface'
                          }`}
                        >
                          {task.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface">{task.projectName ?? '—'}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface">
                        {task.assigneeName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <TaskPriorityLabel priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface">{task.dueDate ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
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
            <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface">
              <span className="text-body-md text-on-surface-variant">
                Showing 1 to {items.length} of {total} entries
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
