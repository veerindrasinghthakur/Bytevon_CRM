import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { NotesPanel } from '@/shared/components/notes/NotesPanel'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { useTaskDetail } from '../hooks/use-task-detail'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { projectRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'

export function TaskDetailPage() {
  const params = useParams({ strict: false }) as { taskId?: string }
  const search = useSearch({ strict: false }) as { edit?: string }
  const id = Number(params.taskId)
  const {
    task,
    isLoading,
    isError,
    refetch,
    isEditing,
    form,
    startEditing,
    cancelEdit,
    save,
    isSaving,
    priorityOptions,
    statusOptions,
  } = useTaskDetail(Number.isFinite(id) ? id : undefined)

  useEffect(() => {
    if (search.edit === '1' && task && !isEditing) startEditing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.edit, task?.id])

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
        <Link to={projectRoutes.tasks}>
          <Button variant="outline">Back to Tasks</Button>
        </Link>
      </div>
    )
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
        title={isEditing ? form.watch('title') || task.title : task.title}
        description={task.projectName ?? 'Task'}
        showBack
        backTo={projectRoutes.tasks}
        backLabel="Back to tasks"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={projectRoutes.tasks} className="hover:text-secondary">
              Tasks
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{task.title}</span>
          </nav>
        }
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => void save()} isLoading={isSaving}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <RefreshButton iconOnly onClick={() => refetch()} />
              <TaskPriorityLabel priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              <EditButton onClick={startEditing} />
            </div>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
          TASK-{task.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <h2 className="text-title-md font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">description</span>
              Description
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="task-title">
                    Title
                  </label>
                  <input
                    id="task-title"
                    {...form.register('title')}
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
                    {...form.register('description')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Priority" {...form.register('priority')} options={priorityOptions} />
                  <Select label="Status" {...form.register('status')} options={statusOptions} />
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1">Assignee</label>
                    <input
                      {...form.register('assigneeName')}
                      onKeyDown={(e) => handleEnterAdvance(e)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1">Due date</label>
                    <input
                      type="date"
                      {...form.register('dueDate')}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {task.description || 'No description provided.'}
              </p>
            )}
          </section>

          <NotesPanel title="Task notes" referenceType="TASK" referenceId={task.id} />
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
                    'bg-surface-container-low/50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{task.assigneeName ?? 'Unassigned'}</p>
                    </div>
                  </div>
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
              {task.projectId ? (
                <Link
                  to={projectRoutes.projectDetailPath}
                  params={{ projectId: String(task.projectId) }}
                  className="block text-sm font-semibold text-secondary hover:underline"
                >
                  Open project →
                </Link>
              ) : null}
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
