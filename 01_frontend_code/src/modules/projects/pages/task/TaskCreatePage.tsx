import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { EntitySearch } from '@/shared/components/forms/EntitySearch'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useTaskCreate } from '../../hooks/task/use-task-create'

export function TaskCreatePage() {
  const {
    form,
    project,
    backTo,
    formError,
    employeeOptions,
    employeesQuery,
    createMutation,
    priority,
    assignee,
    setAssignee,
    setPriority,
    onSubmit,
    cancel,
  } = useTaskCreate()

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-4">
        <BackButton to={backTo} label={project ? `Back to ${project.name}` : 'Back to tasks'} />
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined material-icons-filled">add_task</span>
            </div>
            <div>
              <h2 className="text-headline-md font-bold text-on-surface">Create Task</h2>
              <p className="text-body-md text-on-surface-variant">
                {project
                  ? `For project: ${project.name}`
                  : 'Define a new actionable item for your team'}
              </p>
            </div>
          </div>
          <Link
            {...looseLinkProps({
              to: backTo,
              className:
                'w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors',
            })}
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-5 space-y-6 bg-background">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="material-symbols-outlined text-secondary text-sm">assignment</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Task Identity
                </h3>
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1" htmlFor="title">
                  Task Name
                </label>
                <input
                  id="title"
                  {...register('title')}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-lg text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
                  placeholder="e.g., Finalize Q3 Marketing Report"
                />
                {errors.title && <p className="mt-1 text-body-sm text-error">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  {...register('description')}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 resize-none transition-colors"
                  placeholder="Provide detailed instructions or context..."
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="material-symbols-outlined text-secondary text-sm">person_search</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Assignment
                </h3>
              </div>
              <EntitySearch
                label="Assign to"
                placeholder={
                  employeesQuery.isLoading
                    ? 'Loading employees…'
                    : 'Search employees by name, code, or department…'
                }
                options={employeeOptions}
                value={assignee ?? null}
                onChange={setAssignee}
                disabled={employeesQuery.isLoading}
                emptyMessage={
                  employeesQuery.isError ? 'Failed to load employees' : 'No employees match'
                }
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="material-symbols-outlined text-secondary text-sm">tune</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Additional Details
                </h3>
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Priority</label>
                <div className="flex bg-surface-container rounded-lg p-1">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 px-3 rounded text-center text-body-md font-medium transition-colors ${
                        priority === p
                          ? 'bg-surface text-secondary executive-shadow'
                          : 'text-on-surface-variant hover:bg-surface/50'
                      }`}
                    >
                      {p === 'LOW' && 'Low'}
                      {p === 'MEDIUM' && 'Medium'}
                      {p === 'HIGH' && 'High'}
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('priority')} />
              </div>
            </div>

            {(formError || createMutation.isError) && (
              <p className="text-body-sm text-error" role="alert">
                {formError ??
                  getApiErrorMessage(createMutation.error, 'Failed to create task. Please try again.')}
              </p>
            )}
          </div>

          <div className="p-5 border-t border-outline-variant bg-surface flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={cancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || createMutation.isPending}
              leftIcon={
                <span className="material-symbols-outlined material-icons-filled text-sm">check</span>
              }
            >
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
