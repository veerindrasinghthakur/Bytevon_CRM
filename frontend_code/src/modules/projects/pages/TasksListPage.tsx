import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { useTasks } from '../hooks/use-tasks'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'

/**
 * Tasks list — layout matched to 04_projects/tasks_bytevon_crm.html
 * Metrics + filter bar + data table.
 */
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-surface mb-1">Tasks</h2>
          <p className="text-body-md text-on-surface-variant">
            Manage and track project tasks across your organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">download</span>}>
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

      {/* Metrics – Stitch */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-electric-blue">
              <span className="material-symbols-outlined">task</span>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Tasks</p>
          <h3 className="text-[32px] font-bold text-on-surface">{total}</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Pending</p>
          <h3 className="text-[32px] font-bold text-on-surface">{pending}</h3>
        </div>
        <div className="bg-error/10 border border-error/20 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <p className="text-label-sm text-error mb-1 uppercase tracking-wider">Blocked / Overdue</p>
          <h3 className="text-[32px] font-bold text-error">{blocked}</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Completed</p>
          <h3 className="text-[32px] font-bold text-on-surface">{done}</h3>
        </div>
      </div>

      {/* Table panel */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant bg-surface flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="w-full lg:w-1/3 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="search"
              placeholder="Search task name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md">
              <option>All Projects</option>
            </select>
            <select className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md">
              <option>Priority: All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select className="py-2 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md">
              <option>Status: All</option>
              <option>In Progress</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </div>
        </div>

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
              description="Create your first task to start tracking work."
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
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Task Name
                    </th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {items.map((task) => (
                    <tr
                      key={task.id}
                      className="h-[72px] hover:bg-surface-container/50 transition-colors cursor-pointer group"
                    >
                      <td className="pl-6 pr-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                        {task.description && (
                          <div className="text-[11px] text-on-surface-variant truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface">{task.projectName ?? '—'}</td>
                      <td className="px-4 py-3">
                        {task.assigneeName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold">
                              {task.assigneeName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-body-md text-on-surface">{task.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-body-md text-on-surface-variant italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TaskPriorityLabel priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface">{task.dueDate ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-on-surface-variant hover:text-electric-blue opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="material-symbols-outlined text-sm">more_vert</span>
                        </button>
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
