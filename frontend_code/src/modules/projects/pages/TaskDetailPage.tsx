import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useTask, useUpdateTask } from '../hooks/use-tasks'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import type { TaskPriority, TaskStatus } from '../api/tasks'

export function TaskDetailPage() {
  const params = useParams({ strict: false }) as { taskId?: string }
  const id = Number(params.taskId)
  const { data: task, isLoading, isError, refetch } = useTask(
    Number.isFinite(id) ? id : undefined
  )
  const updateMutation = useUpdateTask()

  const [editing, setEditing] = useState(false)
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
      setEditing(false)
    }
  }, [task])

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? draft.title || task.title : task.title}
        description={task.projectName ?? 'Task'}
        showBack
        backTo="/projects/tasks"
        backLabel="Back to tasks"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects/tasks" className="hover:text-electric-blue">
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
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
              onClick={startEdit}
            >
              Edit
            </Button>
          )
        }
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="text-title-lg text-on-background mb-4">Details</h3>
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
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-desc">
                    Description
                  </label>
                  <textarea
                    id="task-desc"
                    rows={4}
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-priority">
                      Priority
                    </label>
                    <select
                      id="task-priority"
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
                    <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-status">
                      Status
                    </label>
                    <select
                      id="task-status"
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
                    </select>
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-assignee">
                      Assignee
                    </label>
                    <input
                      id="task-assignee"
                      value={draft.assigneeName}
                      onChange={(e) => setDraft((d) => ({ ...d, assigneeName: e.target.value }))}
                      onKeyDown={(e) => handleEnterAdvance(e)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-due">
                      Due date
                    </label>
                    <input
                      id="task-due"
                      type="date"
                      value={draft.dueDate}
                      onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-body-md text-on-surface-variant mb-4">
                  {task.description || 'No description.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <TaskPriorityLabel priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="w-full lg:w-[280px] shrink-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 space-y-4">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Overview</p>
          <OverviewRow label="Project" value={task.projectName ?? '—'} />
          <OverviewRow label="Assignee" value={task.assigneeName ?? 'Unassigned'} />
          <OverviewRow label="Priority" value={task.priority} />
          <OverviewRow label="Status" value={task.status.replace('_', ' ')} />
          <OverviewRow label="Due" value={task.dueDate ?? '—'} />
          <OverviewRow
            label="Created"
            value={new Date(task.createdAt).toLocaleDateString()}
          />
          {task.projectId > 0 && (
            <Link
              to="/projects/$projectId"
              params={{ projectId: String(task.projectId) }}
              className="inline-flex text-secondary text-label-md hover:underline pt-2"
            >
              Open project
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-background font-medium text-right">{value}</span>
    </div>
  )
}
