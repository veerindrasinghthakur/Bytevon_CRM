import { useEffect, useState } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useTask, useUpdateTask } from '../hooks/use-tasks'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import type { TaskPriority, TaskStatus } from '../api/tasks'
import { cn } from '@/shared/lib/cn'

export function TaskDetailPage() {
  const params = useParams({ strict: false }) as { taskId?: string }
  const search = useSearch({ strict: false }) as { edit?: string }
  const id = Number(params.taskId)
  const { data: task, isLoading, isError, refetch } = useTask(
    Number.isFinite(id) ? id : undefined
  )
  const updateMutation = useUpdateTask()

  const [editing, setEditing] = useState(search.edit === '1')
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'TODO' as TaskStatus,
    assigneeName: '',
    dueDate: '',
  })

  useEffect(() => {
    if (task) {
      setDraft({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        assigneeName: task.assigneeName ?? '',
        dueDate: task.dueDate ?? '',
      })
      setEditing(search.edit === '1')
    }
  }, [task, search.edit])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !task) {
    return (
      <div className="text-center py-16">
        <p className="text-body-md text-error mb-3">Task not found.</p>
        <Link to="/projects/tasks">
          <Button variant="outline">Back to Tasks</Button>
        </Link>
      </div>
    )
  }

  const startEdit = () => setEditing(true)
  const cancelEdit = () => {
    setDraft({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      assigneeName: task.assigneeName ?? '',
      dueDate: task.dueDate ?? '',
    })
    setEditing(false)
  }

  const saveEdit = async () => {
    await updateMutation.mutateAsync({
      id: task.id,
      patch: {
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        status: draft.status,
        assigneeName: draft.assigneeName || undefined,
        dueDate: draft.dueDate || null,
      },
    })
    setEditing(false)
    void refetch()
  }

  const initials = (task.assigneeName ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={editing ? draft.title || task.title : task.title}
        description={task.projectName ?? 'Task'}
        showBack
        backTo="/projects/tasks"
        backLabel="Back to tasks"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects/tasks" className="hover:text-secondary">
              Tasks
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{task.title}</span>
          </nav>
        }
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void saveEdit()}
                isLoading={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <TaskPriorityLabel priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
                onClick={startEdit}
              >
                Edit
              </Button>
              <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-lg">archive</span>}>
                Archive
              </Button>
            </div>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
          TASK-{task.id}
        </span>
      </div>

      {!editing && task.description && (
        <p className="text-body-md text-on-surface-variant max-w-3xl">{task.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <h2 className="text-title-md font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">description</span>
              Description
            </h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-title">
                    Title
                  </label>
                  <input
                    id="task-title"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-desc">
                    Description
                  </label>
                  <textarea
                    id="task-desc"
                    rows={6}
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1">Priority</label>
                    <select
                      value={draft.priority}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1">Status</label>
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, status: e.target.value as TaskStatus }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    >
                      <option value="TODO">To do</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="IN_REVIEW">In review</option>
                      <option value="DONE">Done</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="ON_HOLD">On hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1">Assignee</label>
                    <input
                      value={draft.assigneeName}
                      onChange={(e) => setDraft((d) => ({ ...d, assigneeName: e.target.value }))}
                      onKeyDown={(e) => handleEnterAdvance(e)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1">Due date</label>
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed space-y-3">
                <p>{task.description || 'No description provided.'}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bv-surface overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low/50">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">info</span>
                Task Details
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                  Assignee
                </label>
                <div
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border border-outline-variant',
                    'bg-surface-container-low/50 hover:border-secondary/40 transition-colors'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {task.assigneeName ?? 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">Assignee</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">person_add</span>
                </div>
              </div>
              <MetaRow label="Project" value={task.projectName ?? '—'} />
              <MetaRow label="Priority" value={task.priority} />
              <MetaRow label="Status" value={task.status.replace(/_/g, ' ')} />
              <MetaRow label="Due" value={task.dueDate ?? '—'} />
              <MetaRow
                label="Created"
                value={task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—'}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-background text-right">{value}</span>
    </div>
  )
}
