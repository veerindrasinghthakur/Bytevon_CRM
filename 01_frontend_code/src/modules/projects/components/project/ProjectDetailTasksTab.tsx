import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { Can } from '@/shared/rbac'
import { TaskStatusBadge, TaskPriorityLabel } from '../task/TaskStatusBadge'
import { projectRoutes } from '../../routes'
import type { Task } from '../../types'

type StatusOption = { value: string; label: string }

type Props = {
  tasksLoading: boolean
  filteredTasks: Task[]
  taskSearch: string
  setTaskSearch: (v: string) => void
  taskStatusFilter: string
  setTaskStatusFilter: (v: string) => void
  taskStatusOptions: readonly StatusOption[]
  onCreateTask: () => void
}

export function ProjectDetailTasksTab({
  tasksLoading,
  filteredTasks,
  taskSearch,
  setTaskSearch,
  taskStatusFilter,
  setTaskStatusFilter,
  taskStatusOptions,
  onCreateTask,
}: Props) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <Select
          value={taskStatusFilter}
          onChange={setTaskStatusFilter}
          placeholder="All statuses"
          options={taskStatusOptions.map((o) => ({ value: o.value, label: o.label }))}
          minWidthClass="min-w-[160px]"
        />
        <Can action="CREATE" resource="task">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={onCreateTask}
          >
            New Task
          </Button>
        </Can>
      </div>

      {tasksLoading && <Skeleton className="h-40 w-full" />}
      {!tasksLoading && filteredTasks.length === 0 && (
        <p className="text-center text-on-surface-variant py-12">No tasks match filters.</p>
      )}
      {!tasksLoading && filteredTasks.length > 0 && (
        <div className="bv-surface overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Task</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Priority</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Status</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Assignee</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Due</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-outline-variant hover:bg-surface-container-low/40 cursor-pointer"
                  onClick={() =>
                    safeNavigate(navigate, {
                      to: projectRoutes.taskDetailPath,
                      params: { taskId: String(task.id) },
                    })
                  }
                >
                  <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
                  <td className="px-4 py-3">
                    <TaskPriorityLabel priority={task.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">{task.assigneeName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">{task.dueDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

