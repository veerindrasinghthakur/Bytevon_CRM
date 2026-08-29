import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { Pagination, paginate, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useTasks } from '../hooks/use-tasks'
import { projectRoutes } from '../routes'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { CreateTaskModal } from '../components/CreateTaskModal'
import type { Task } from '../types'
import { cn } from '@/shared/lib/cn'
import { taskStatusColors, TaskPriorityOptions, TaskStatusOptions } from '../cssTokens'

const statusDot: Record<string, string> = {
  TODO: taskStatusColors.TODO.className,
  IN_PROGRESS: taskStatusColors.IN_PROGRESS.className,
  IN_REVIEW: taskStatusColors.IN_REVIEW.className,
  DONE: taskStatusColors.DONE.className,
  BLOCKED: taskStatusColors.BLOCKED.className,
  ON_HOLD: taskStatusColors.ON_HOLD.className,
}

function TaskQuickContent({ task }: { task: Task }) {
  return (
    <>
      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile
            icon="flag"
            label="Status"
            value={<TaskStatusBadge status={task.status} />}
          />
          <QuickMetaTile
            icon="priority_high"
            label="Priority"
            value={<TaskPriorityLabel priority={task.priority} />}
          />
          <QuickMetaTile icon="event" label="Due date" value={task.dueDate ?? '—'} />
          <QuickMetaTile icon="folder_open" label="Project" value={task.projectName ?? '—'} />
        </div>
      </QuickSection>

      <QuickSection title="Assignment">
        {task.assigneeName ? (
          <QuickPersonRow
            initials={task.assigneeName
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
            roleLabel="Assignee"
            name={task.assigneeName}
          />
        ) : (
          <QuickRelatedRow icon="person_off" label="Assignee" value="Unassigned" />
        )}
      </QuickSection>

      <QuickSection title="Related">
        <QuickRelatedRow icon="folder_open" label="Project" value={task.projectName ?? '—'} />
        <QuickRelatedRow icon="event" label="Due" value={task.dueDate ?? '—'} />
        <QuickRelatedRow icon="title" label="Task" value={task.title} />
      </QuickSection>
    </>
  )
}

export function TasksListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useTasks({
    search: search || undefined,
    status: status || undefined,
  })

  const filtersActive = Boolean(search || status || priority)

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPriority('')
    setPage(1)
  }

  const filtered = useMemo(() => {
    let list = data?.items ?? []
    if (priority) list = list.filter((t) => t.priority === priority)
    return list
  }, [data, priority])

  const total = filtered.length
  const pageItems = useMemo(() => paginate(filtered, page, DEFAULT_PAGE_SIZE), [filtered, page])

  const selection = useListSelection({
    items: pageItems,
    getId: (t) => String(t.id),
  })

  const pending = filtered.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length
  const done = filtered.filter((t) => t.status === 'DONE').length
  const blocked = filtered.filter((t) => t.status === 'BLOCKED').length

  const goTask = (taskId: number, edit?: boolean) =>
    safeNavigate(navigate, {
      to: projectRoutes.taskDetail(taskId),
      params: { taskId: String(taskId) },
      search: edit ? { edit: '1' } : undefined,
    })

  const openTaskOverview = (task: Task) => {
    openPanel({
      title: task.title,
      subtitle: task.projectName ?? 'No project',
      icon: 'assignment',
      status: task.status.replace(/_/g, ' '),
      statusDotClass: statusDot[task.status] ?? 'bg-outline',
      content: <TaskQuickContent task={task} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goTask(task.id),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-background">Tasks</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Tasks are work items under projects across the organization.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ExportButton
            resource={ResourceName.TASK}
            query={search}
            filters={{ status, priority }}
            filenameStem="tasks"
          />
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => setCreateOpen(true)}
          >
            New Task
          </Button>
        </div>
      </section>

      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search task name..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={priority}
          onChange={(v) => {
            setPriority(v)
            setPage(1)
          }}
          placeholder="Priority: All"
          aria-label="Filter by priority"
          options={[
            { value: '', label: 'Priority: All' },
            ...TaskPriorityOptions,
          ]}
        />
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          placeholder="Status: All"
          aria-label="Filter by status"
          options={[
            { value: '', label: 'Status: All' },
            ...TaskStatusOptions,
          ]}
        />
      </ListToolbar>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat label="Total Tasks" value={String(total || '—')} icon="assignment" tone="bg-electric-blue/10 text-electric-blue" />
        <Stat label="Pending" value={String(pending)} icon="pending_actions" tone="bg-warning-container text-on-warning" />
        <Stat label="Blocked / Overdue" value={String(blocked)} icon="block" tone="bg-error-container text-error" danger={blocked > 0} />
        <Stat label="Completed" value={String(done)} icon="check_circle" tone="bg-success-container text-on-success" />
      </section>

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={pageItems.length}
          onCancel={selection.exitSelectionMode}
        >
          <ExportButton
            resource={ResourceName.TASK}
            selectedIds={Array.from(selection.selectedIds)}
            filenameStem="tasks-selected"
            label="Export selected"
          />
        </BulkSelectionBar>
      )}

      {isLoading && <TableSkeleton rows={5} />}
      {isError && (
        <ErrorState
          title="Failed to load tasks"
          description="We could not load the tasks list. Check your connection and try again."
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon="assignment"
          title="No tasks found"
          description="Adjust filters or create a task."
          actionLabel="New Task"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <section className="bv-surface overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface/50">
                  <th className="py-4 px-6 w-12">
                    {selection.selectionMode ? (
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant w-4 h-4"
                        checked={selection.allFilteredSelected}
                        onChange={selection.toggleSelectAllFiltered}
                        title="Select all on this page"
                        aria-label="Select all on this page"
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
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
                {pageItems.map((task) => {
                  const id = String(task.id)
                  const isSelected = selection.isSelected(id)

                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        'h-[72px] cursor-pointer select-none',
                        isSelected ? 'bg-secondary/10' : 'zebra-row',
                      )}
                      onMouseDown={() => selection.onRowPressStart(id)}
                      onMouseUp={() => selection.onRowPressEnd(id, () => openTaskOverview(task))}
                      onMouseLeave={selection.onRowPressCancel}
                      onTouchStart={() => selection.onRowPressStart(id)}
                      onTouchEnd={() => selection.onRowPressEnd(id, () => openTaskOverview(task))}
                      onTouchCancel={selection.onRowPressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <td
                        className="py-2 px-6"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selection.selectionMode) selection.toggleOne(id)
                        }}
                      >
                        {selection.selectionMode ? (
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant w-4 h-4"
                            checked={isSelected}
                            onChange={() => selection.toggleOne(id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-outline-variant" aria-hidden />
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <p
                          className={cn(
                            'text-body-md font-semibold',
                            task.status === 'DONE'
                              ? 'text-on-surface-variant line-through'
                              : 'text-on-background',
                          )}
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
                      <td className="py-2 px-6 text-right" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <RowActions
                            label={`Actions for ${task.title}`}
                            actions={[
                              {
                                id: 'overview',
                                label: 'Quick view',
                                icon: 'visibility',
                                onClick: () => openTaskOverview(task),
                              },
                              { id: 'view', label: 'View', icon: 'description', onClick: () => goTask(task.id) },
                              { id: 'edit', label: 'Edit', icon: 'edit', onClick: () => goTask(task.id, true) },
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
          <Pagination page={page} total={total} onPageChange={setPage} itemLabel="Tasks" />
          {total <= DEFAULT_PAGE_SIZE && (
            <div className="border-t border-outline-variant/30 p-4">
              <p className="text-[11px] text-on-surface-variant">
                Showing <span className="font-semibold text-on-background">1-{total}</span> of{' '}
                <span className="font-semibold text-on-background">{total}</span> Tasks
                {!selection.selectionMode && (
                  <span className="ml-2 opacity-80">· Hold a row 3s to multi-select</span>
                )}
              </p>
            </div>
          )}
        </section>
      )}

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void refetch()} />
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  tone,
  danger,
}: {
  label: string
  value: string
  icon: string
  tone: string
  danger?: boolean
}) {
  return (
    <div className="bv-surface card-hover p-5 flex flex-col justify-between h-[160px]">
      <div className="flex justify-between items-start">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', tone)}>
          <span className="material-symbols-outlined material-icons-filled">{icon}</span>
        </div>
        {danger && <span className="status-badge status-error text-xs font-bold">At risk</span>}
      </div>
      <div>
        <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
        <h3 className="text-[32px] font-bold text-on-background leading-none">{value}</h3>
      </div>
    </div>
  )
}
