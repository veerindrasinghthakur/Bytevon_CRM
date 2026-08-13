import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Pagination, paginate, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { useTasks } from '../hooks/use-tasks'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'

export function TasksListPage() {
  const navigate = useNavigate()
  const { open: openOverview } = useQuickOverview()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)

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

  const pending = filtered.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length
  const done = filtered.filter((t) => t.status === 'DONE').length
  const blocked = filtered.filter((t) => t.status === 'BLOCKED').length

  const goTask = (taskId: number, edit?: boolean) =>
    navigate({
      to: '/projects/tasks/$taskId',
      params: { taskId: String(taskId) },
      search: edit ? { edit: '1' } : undefined,
    })

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-background">Tasks</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Tasks are work items under projects across the organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>
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
          options={[
            { value: 'URGENT', label: 'Urgent' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ]}
        />
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          placeholder="Status: All"
          options={[
            { value: 'TODO', label: 'To do' },
            { value: 'IN_PROGRESS', label: 'In progress' },
            { value: 'IN_REVIEW', label: 'In review' },
            { value: 'DONE', label: 'Done' },
            { value: 'BLOCKED', label: 'Blocked' },
            { value: 'ON_HOLD', label: 'On hold' },
          ]}
        />
      </ListToolbar>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat label="Total Tasks" value={String(total || '—')} icon="assignment" tone="bg-electric-blue/10 text-electric-blue" />
        <Stat label="Pending" value={String(pending)} icon="pending_actions" tone="bg-amber-100 text-amber-700" />
        <Stat label="Blocked / Overdue" value={String(blocked)} icon="block" tone="bg-red-100 text-red-600" danger={blocked > 0} />
        <Stat label="Completed" value={String(done)} icon="check_circle" tone="bg-emerald-100 text-emerald-700" />
      </section>

      {isLoading && <TableSkeleton rows={5} />}
      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load tasks.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon="assignment"
          title="No tasks found"
          description="Adjust filters or create a task."
          actionLabel="New Task"
          onAction={() => navigate({ to: '/projects/tasks/new' })}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
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
                {pageItems.map((task) => (
                  <tr
                    key={task.id}
                    className="h-[72px] cursor-pointer hover:bg-surface-container/40"
                    onClick={() =>
                      openOverview({
                        id: task.id,
                        title: task.title,
                        subtitle: task.projectName,
                        badge: task.status.replace('_', ' '),
                        fields: [
                          { label: 'Assignee', value: task.assigneeName ?? 'Unassigned' },
                          { label: 'Priority', value: task.priority },
                          { label: 'Status', value: task.status.replace('_', ' ') },
                          { label: 'Due', value: task.dueDate ?? '—' },
                          { label: 'Project', value: task.projectName ?? '—' },
                        ],
                        detailTo: '/projects/tasks/$taskId',
                        detailParams: { taskId: String(task.id) },
                        editTo: '/projects/tasks/$taskId',
                        editParams: { taskId: String(task.id) },
                      })
                    }
                  >
                    <td className="py-2 px-6" onClick={(e) => e.stopPropagation()}>
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
                    <td className="py-2 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <RowActions
                          label={`Actions for ${task.title}`}
                          actions={[
                            { id: 'view', label: 'View', icon: 'description', onClick: () => goTask(task.id) },
                            { id: 'edit', label: 'Edit', icon: 'edit', onClick: () => goTask(task.id, true) },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPageChange={setPage} itemLabel="Tasks" />
          {total <= DEFAULT_PAGE_SIZE && (
            <div className="border-t border-outline-variant/30 p-4">
              <p className="text-[11px] text-on-surface-variant">
                Showing <span className="font-semibold text-on-background">1-{total}</span> of{' '}
                <span className="font-semibold text-on-background">{total}</span> Tasks
              </p>
            </div>
          )}
        </section>
      )}
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
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between h-[160px]">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {danger && (
          <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">At risk</div>
        )}
      </div>
      <div>
        <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
        <h3 className="text-[32px] font-bold text-on-background leading-none">{value}</h3>
      </div>
    </div>
  )
}
