import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { getMyTask } from '../../api/my-work'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { priorityClass, statusDot } from '../../schemas/enums'
import { myWorkRoutes } from '../../routes'

export function MyTaskDetailPage() {
  const { taskId } = useParams({ strict: false }) as { taskId: string }
  const navigate = useNavigate()
  const {
    data: task,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myWork.tasks.detail(taskId),
    queryFn: () => getMyTask(taskId),
    enabled: Boolean(taskId),
  })

  useDeletedRedirect({ ready: !isLoading, data: task ?? null, error, listTo: myWorkRoutes.tasks })

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Task details" showBack />
        <PageLoadingSkeleton />
      </div>
    )
  }

  if (isError || !task) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Task details" showBack />
        <ErrorState
          title="Task not found"
          description={getApiErrorMessage(error, 'This task does not exist or you do not have access to it.')}
          onRetry={() => void refetch()}
          onBack={() => safeNavigate(navigate, { to: myWorkRoutes.tasks })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={task.name}
        description={task.project ?? 'No project linked'}
        showBack
        actions={
          <Button
            variant="outline"
            leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
            onClick={() => console.info('Edit task', task.id)}
          >
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg text-on-background mb-4">Overview</h3>
            <p className="text-body-md text-on-surface-variant">
              {task.project
                ? `Work item under project “${task.project}”. Estimated effort ${task.estimatedHours ?? 'not set'}.`
                : 'Personal task with no project link yet.'}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-label-sm text-on-surface-variant">Due date</p>
                <p className="text-body-lg font-bold text-on-background mt-1">{task.dueDate}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-label-sm text-on-surface-variant">Estimated time</p>
                <p className="text-body-lg font-bold text-on-background mt-1">{task.estimatedHours ?? '—'}</p>
              </div>
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg text-on-background mb-3">Activity</h3>
            <p className="text-body-md text-on-surface-variant">
              No comments or status changes yet.
            </p>
          </section>
        </div>

        <div className="space-y-4">
          <section className="bv-surface p-6">
            <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Status</h3>
            <span className="flex items-center gap-2 text-body-md text-on-surface">
              <span className={`w-2.5 h-2.5 rounded-full ${statusDot[task.status] ?? 'bg-outline'}`} />
              {task.status}
            </span>
          </section>

          <section className="bv-surface p-6 space-y-4">
            <div>
              <p className="text-label-sm text-on-surface-variant">Priority</p>
              <span
                className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-label-sm font-bold ${priorityClass[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Project</p>
              <p className="text-body-md text-on-surface mt-0.5">{task.project ?? '—'}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Assignee</p>
              <p className="text-body-md text-on-surface mt-0.5">{task.assignee ?? '—'}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Due</p>
              <p className="text-body-md text-on-surface mt-0.5">{task.dueDate}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Est. time</p>
              <p className="text-body-md text-on-surface mt-0.5">{task.estimatedHours ?? '—'}</p>
            </div>
          </section>

          <section className="bv-surface p-4 space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => safeNavigate(navigate, { to: myWorkRoutes.tasksNew })}
            >
              Create task
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => safeNavigate(navigate, { to: myWorkRoutes.tasks })}
            >
              All my tasks
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
