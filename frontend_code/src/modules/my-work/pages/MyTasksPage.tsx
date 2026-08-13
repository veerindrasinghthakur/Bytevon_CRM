import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { myTasks } from '../data/mock'
import type { MyTask } from '../types'

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

export function MyTasksPage() {
  const navigate = useNavigate()
  const open = myTasks.filter((t) => t.status !== 'Completed').length
  const inProgress = myTasks.filter((t) => t.status === 'In Progress').length
  const high = myTasks.filter((t) => t.priority === 'High' || t.priority === 'Critical').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks"
        description="Tasks assigned to you — or create your own."
        showBack
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add_task</span>}
            onClick={() => navigate({ to: '/my-work/tasks/new' })}
          >
            Create task
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">Open tasks</p>
          <p className="text-headline-md font-bold text-on-background">{open}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">In progress</p>
          <p className="text-headline-md font-bold text-secondary">{inProgress}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">High / Critical</p>
          <p className="text-headline-md font-bold text-error">{high}</p>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
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
              {myTasks.map((task: MyTask) => (
                <tr
                  key={task.id}
                  className="hover:bg-secondary/5 cursor-pointer"
                  onClick={() => navigate({ to: '/my-work/tasks/$taskId', params: { taskId: task.id } })}
                >
                  <td className="px-6 py-4 text-label-md font-semibold text-on-background text-secondary">
                    {task.name}
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{task.project ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold ${priorityClass[task.priority]}`}>
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
