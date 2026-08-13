import { useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { myTasks } from '../data/mock'

const priorityClass: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-surface-container-high text-on-surface-variant',
  Low: 'bg-surface-container text-on-surface-variant',
}

const statusDot: Record<string, string> = {
  'In Progress': 'bg-secondary',
  Pending: 'bg-outline',
  'Not Started': 'bg-outline',
  Completed: 'bg-emerald-500',
  Blocked: 'bg-orange-500',
}

export function MyTaskDetailPage() {
  const { taskId } = useParams({ strict: false }) as { taskId: string }
  const task = myTasks.find((t) => t.id === taskId) ?? myTasks[0]

  if (!task) {
    return (
      <div>
        <PageHeader title="Task details" showBack />
        <p className="text-body-md text-on-surface-variant">Task not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={task.name} description={task.project ?? 'No project'} showBack />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold ${priorityClass[task.priority]}`}>
            {task.priority}
          </span>
          <span className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
            <span className={`w-2 h-2 rounded-full ${statusDot[task.status] ?? 'bg-outline'}`} />
            {task.status}
          </span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-label-sm text-on-surface-variant">Project</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{task.project ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Due date</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{task.dueDate}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Estimated time</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">
              {task.estimatedHours ?? '—'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
