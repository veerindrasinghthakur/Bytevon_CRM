import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { useTasks } from '../hooks/use-tasks'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'

export function TasksListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useTasks({
    search: search || undefined,
  })

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="All project tasks."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/projects/tasks/new' })}
          >
            New Task
          </Button>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center flex-1 max-w-sm bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant focus-within:border-electric-blue focus-within:border-2 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
      </div>

      {isLoading && <TableSkeleton rows={5} />}

      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load tasks.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState
          icon="assignment"
          title="No tasks yet"
          description="Create your first task to start tracking work."
          actionLabel="New Task"
          onAction={() => navigate({ to: '/projects/tasks/new' })}
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((task) => (
            <article
              key={task.id}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5 hover:border-electric-blue/40 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-body-lg font-semibold text-on-background truncate">
                    {task.title}
                  </h3>
                  <TaskStatusBadge status={task.status} />
                </div>
                {task.description && (
                  <p className="text-body-sm text-on-surface-variant line-clamp-1 mb-2">
                    {task.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
                  {task.projectName && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">account_tree</span>
                      {task.projectName}
                    </span>
                  )}
                  {task.assigneeName && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">person</span>
                      {task.assigneeName}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">event</span>
                      {task.dueDate}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <TaskPriorityLabel priority={task.priority} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
