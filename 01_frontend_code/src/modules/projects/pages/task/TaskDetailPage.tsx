import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { NotesPanel } from '@/shared/components/notes/NotesPanel'
import { EntitySearch } from '@/shared/components/forms/EntitySearch'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { useTaskDetail } from '../../hooks/task/use-task-detail'
import { TaskStatusBadge, TaskPriorityLabel } from '../../components/task/TaskStatusBadge'
import { TaskDetailSidebar } from '../../components/task/TaskDetailSidebar'
import { projectRoutes } from '../../routes'
import type { TaskPriority, TaskStatus } from '../../types'

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
    saveWithAssignee,
    isSaving,
    saveError,
    priorityOptions,
    statusOptions,
    assignee,
    setAssignee,
    employeeOptions,
    membersQuery,
    teamId,
    needsTeam,
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
        <Link {...looseLinkProps({ to: projectRoutes.tasks })}>
          <Button variant="outline">Back to Tasks</Button>
        </Link>
      </div>
    )
  }

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
            <Link {...looseLinkProps({ to: projectRoutes.tasks, className: 'hover:text-secondary' })}>
              Tasks
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{task.title}</span>
          </nav>
        }
        actions={
          isEditing ? (
            <div className="flex gap-2 items-center flex-wrap">
              <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={saveWithAssignee}
                isLoading={isSaving}
                disabled={needsTeam}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <TaskPriorityLabel priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              <div className="flex items-center gap-2">
                <EditButton onClick={startEditing} />
                <RefreshButton iconOnly onClick={() => refetch()} size="md" />
              </div>
            </div>
          )
        }
      />

      {saveError && (
        <p className="text-body-sm text-error px-1" role="alert">
          {saveError}
        </p>
      )}

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
                  {form.formState.errors.title && (
                    <p className="text-body-sm text-error mt-1">{form.formState.errors.title.message}</p>
                  )}
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
                  <Select
                    label="Priority"
                    value={form.watch('priority')}
                    onChange={(v) => form.setValue('priority', v as TaskPriority, { shouldValidate: true })}
                    options={priorityOptions}
                  />
                  <Select
                    label="Status"
                    value={form.watch('status')}
                    onChange={(v) => form.setValue('status', v as TaskStatus, { shouldValidate: true })}
                    options={statusOptions}
                  />
                  <div className="sm:col-span-2">
                    {needsTeam ? (
                      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                        <p className="text-body-sm text-on-surface-variant">
                          This project has no team assigned. Assign a team on the project first to pick
                          an assignee from team members.
                        </p>
                      </div>
                    ) : (
                      <EntitySearch
                        label="Assignee (team members)"
                        placeholder={
                          membersQuery.isLoading
                            ? 'Loading team members…'
                            : teamId
                              ? 'Search team members…'
                              : 'Select assignee…'
                        }
                        options={employeeOptions}
                        value={assignee}
                        onChange={(opt) => {
                          setAssignee(opt)
                          form.setValue('assigneeName', opt?.label ?? '')
                        }}
                        disabled={membersQuery.isLoading || !teamId}
                        emptyMessage={
                          membersQuery.isError
                            ? 'Failed to load team members'
                            : 'No team members found'
                        }
                      />
                    )}
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

        <TaskDetailSidebar task={task} />
      </div>
    </div>
  )
}
