import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { useMyTasks } from '../hooks/use-my-tasks'
import type { MyTask } from '../types'
import { cn } from '@/shared/lib/cn'
import { priorityClass, statusDot } from '../schemas/enums'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../routes'
import { useTasksPageFilter } from '../hooks/use-tasks-page-filter'

type TaskFilter = 'open' | 'inProgress' | 'high' | null

function TaskQuickContent({ task }: { task: MyTask }) {
  return (
    <>
      <QuickSection title="Status">
        <QuickStatGrid>
          <QuickStat icon="flag" value={task.status} label="Status" />
          <QuickStat icon="priority_high" value={task.priority} label="Priority" />
          <QuickStat icon="event" value={task.dueDate} label="Due" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Details">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="folder" label="Project" value={task.project ?? '—'} />
          <QuickMetaTile icon="timer" label="Estimate" value={task.estimatedHours ?? '—'} />
        </div>
      </QuickSection>
      <QuickSection title="Task">
        <QuickRelatedRow icon="task_alt" label="Name" value={task.name} />
        <QuickRelatedRow icon="tag" label="ID" value={task.id} />
      </QuickSection>
    </>
  )
}

export function MyTasksPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const { cardFilter, setCardFilter } = useTasksPageFilter()
  const {
    tasks,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtersActive,
    resetFilters,
    isLoading,
    isFetching,
    isError,
    refetch,
    selectedIds,
  } = useMyTasks()

  const open = tasks.filter((t) => t.status !== 'Completed').length
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length
  const high = tasks.filter((t) => t.priority === 'High' || t.priority === 'Critical').length

  const filtered = useMemo(() => {
    let list = tasks
    if (cardFilter === 'open') list = list.filter((t) => t.status !== 'Completed')
    if (cardFilter === 'inProgress') list = list.filter((t) => t.status === 'In Progress')
    if (cardFilter === 'high')
      list = list.filter((t) => t.priority === 'High' || t.priority === 'Critical')
    return list
  }, [tasks, cardFilter])

  const openTaskOverview = (task: MyTask) => {
    openPanel({
      title: task.name,
      subtitle: [task.project, task.id].filter(Boolean).join(' · '),
      icon: 'task_alt',
      status: task.status,
      statusDotClass: statusDot[task.status] ?? 'bg-outline',
      content: <TaskQuickContent task={task} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => safeNavigate(navigate,{ to: myWorkRoutes.taskDetail(task.id) }),
      widthClass: 'max-w-[520px]',
    })
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load tasks"
        description="My tasks failed to load. Retry or go back."
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Tasks"
        description="Tasks assigned to you — or create your own."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add_task</span>}
            onClick={() => safeNavigate(navigate,{ to: myWorkRoutes.tasksNew })}
          >
            Create task
          </Button>
        }
      />

      <div className="flex items-center justify-end min-h-[32px]">
        {cardFilter ? (
          <button
            type="button"
            onClick={() => setCardFilter(null)}
            className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant hover:text-on-surface rounded-md px-2 py-1 transition-colors"
            aria-label="Clear filter"
          >
            <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
            <span>Clear filter</span>
          </button>
        ) : (
          <span className="invisible text-label-md px-2 py-1" aria-hidden>
            Clear filter
          </span>
        )}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          className={cn(
            'bv-surface card-hover p-5 cursor-pointer text-left w-full',
            cardFilter === 'open' && 'ring-1 ring-secondary/30 border-secondary',
          )}
          onClick={() => setCardFilter((f) => (f === 'open' ? null : 'open'))}
        >
          <p className="text-label-sm text-on-surface-variant mb-1">Open tasks</p>
          <p className="text-headline-md font-bold text-on-background">{open}</p>
        </button>
        <button
          type="button"
          className={cn(
            'bv-surface card-hover p-5 cursor-pointer text-left w-full',
            cardFilter === 'inProgress' && 'ring-1 ring-secondary/30 border-secondary',
          )}
          onClick={() => setCardFilter((f) => (f === 'inProgress' ? null : 'inProgress'))}
        >
          <p className="text-label-sm text-on-surface-variant mb-1">In progress</p>
          <p className="text-headline-md font-bold text-secondary">{inProgress}</p>
        </button>
        <button
          type="button"
          className={cn(
            'bv-surface card-hover p-5 cursor-pointer text-left w-full',
            cardFilter === 'high' && 'ring-1 ring-secondary/30 border-secondary',
          )}
          onClick={() => setCardFilter((f) => (f === 'high' ? null : 'high'))}
        >
          <p className="text-label-sm text-on-surface-variant mb-1">High / Critical</p>
          <p className="text-headline-md font-bold text-error">{high}</p>
        </button>
      </section>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tasks or projects…"
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
        actions={
          <ExportButton
            resource="TASK"
            selectedIds={selectedIds}
            filters={{ status: statusFilter !== 'All' ? statusFilter : undefined }}
            query={search}
            filenameStem="my-tasks"
          />
        }
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All status"
          options={[
            { value: 'All', label: 'All status' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Not Started', label: 'Not Started' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Blocked', label: 'Blocked' },
          ]}
          minWidthClass="min-w-[140px]"
        />
      </ListToolbar>

      <section className="bv-surface overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
            <TableSkeleton rows={5} />
          </div>
        )}
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-title-lg font-semibold text-on-background">All assigned tasks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Task</th>
                <th className="px-6 py-3 font-semibold">Project</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Due</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-body-md text-on-surface-variant">
                    No tasks match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((task: MyTask) => (
                <tr
                  key={task.id}
                  className="zebra-row cursor-pointer"
                  onClick={() => openTaskOverview(task)}
                >
                  <td className="px-6 py-4 text-label-md font-semibold text-secondary">{task.name}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{task.project ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={priorityClass[task.priority] ?? 'status-badge status-neutral'}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{task.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
                      <span className={`w-2 h-2 rounded-full ${statusDot[task.status] ?? 'bg-outline'}`} />
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{task.estimatedHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}