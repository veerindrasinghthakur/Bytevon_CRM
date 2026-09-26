import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import type { EmployeeDashboardData } from '../../types/dashboard.types'

const card = 'bv-surface card-hover'

export function EmployeeTasksTable({
  tasks,
  onNewTask,
}: {
  tasks: EmployeeDashboardData['tasks']
  onNewTask: () => void
}) {
  return (
    <section className={`${card} overflow-hidden`}>
      <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
        <h3 className="text-title-lg text-on-background">Assigned Tasks</h3>
        <Can action={Action.CREATE} resource={'task'}>
          <button
            type="button"
            onClick={onNewTask}
            className="px-3 py-1.5 text-label-sm bg-secondary text-on-secondary rounded-md bv-pressable"
          >
            + New Task
          </button>
        </Can>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Task Name</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Due Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Est. Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {tasks.map((t) => (
              <tr key={t.name} className="zebra-row group">
                <td className="px-6 py-4 font-semibold text-on-surface">{t.name}</td>
                <td className="px-6 py-4">
                  <span
                    className={
                      t.priority === 'High'
                        ? 'bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full text-label-sm font-bold'
                        : 'bg-surface-container-highest text-on-surface-variant px-2.5 py-0.5 rounded-full text-label-sm'
                    }
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-label-md text-on-surface-variant">{t.due}</td>
                <td className="px-6 py-4 text-label-md">{t.status}</td>
                <td className="px-6 py-4 text-label-md text-on-surface-variant">{t.est}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
