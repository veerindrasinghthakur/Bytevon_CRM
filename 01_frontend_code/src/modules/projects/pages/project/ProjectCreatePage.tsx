import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Select } from '@/shared/components/ui/Select'
import { EntitySearch } from '@/shared/components/forms/EntitySearch'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { projectRoutes } from '../../routes'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { ProjectPhaseOptions, ProjectPriorityOptions } from '../../enums'
import type { AssignMode, PhaseValue, PriorityValue } from '../../types'
import { useProjectCreate } from '../../hooks/project/use-project-create'

const ASSIGN_OPTIONS = [
  {
    id: 'existing' as const,
    title: 'Assign Existing Team',
    desc: 'Search and allocate a pre-configured team.',
  },
  {
    id: 'new' as const,
    title: 'Create New Team',
    desc: 'After project save, build a team and auto-assign it here.',
  },
  {
    id: 'Individual' as const,
    title: 'Assign to an Individual',
    desc: 'Assign the project to a single employee.',
  },
  {
    id: 'later' as const,
    title: 'Assign Later',
    desc: 'Setup shell project, add members later.',
  },
] as const

export function ProjectCreatePage() {
  const {
    form,
    assignMode,
    setAssignMode,
    selectedClient,
    setSelectedClient,
    selectedTeam,
    setSelectedTeam,
    selectedEmployee,
    setSelectedEmployee,
    formError,
    phase,
    setPhase,
    priority,
    setPriority,
    clientOptions,
    teamOptions,
    employeeOptions,
    teamsLoading,
    clientsQuery,
    employeesQuery,
    createMutation,
    onSubmit,
    cancel,
  } = useProjectCreate()

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton to={projectRoutes.list} label="Back to projects" />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant bg-surface">
          <div>
            <h2 className="text-xl font-bold text-on-background">Create New Project</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Configure workspace, team allocation, and repository details.
            </p>
          </div>
          <Link
            {...looseLinkProps({
              to: projectRoutes.list,
              className:
                'text-on-surface-variant hover:text-error p-1 rounded-md hover:bg-surface-container',
            })}
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-8 bg-background/50">
            <section>
              <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                Core Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-on-background" htmlFor="name">
                    Project Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="name"
                    {...register('name')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none bg-surface-container-lowest text-on-background"
                    placeholder="e.g., Nexus Platform Migration"
                  />
                  {errors.name && <p className="text-body-sm text-error">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <EntitySearch
                    label="Client *"
                    placeholder={
                      clientsQuery.isLoading
                        ? 'Loading clients…'
                        : 'Search active clients by name, industry, country…'
                    }
                    options={clientOptions}
                    value={selectedClient}
                    onChange={setSelectedClient}
                    disabled={clientsQuery.isLoading}
                    emptyMessage={
                      clientsQuery.isError
                        ? 'Failed to load clients'
                        : 'No active clients match — create a client in Sales first'
                    }
                  />
                  {clientsQuery.isError && (
                    <p className="text-body-sm text-error">
                      {getApiErrorMessage(clientsQuery.error, 'Could not load clients')}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-on-background" htmlFor="description">
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    {...register('description')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none bg-surface-container-lowest text-on-background resize-none"
                    placeholder="Brief overview of the project goals and scope..."
                  />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                  Assignment Strategy
                </h3>
                <div className="space-y-3">
                  {ASSIGN_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer bg-surface-container-lowest ${
                        assignMode === opt.id
                          ? 'border-secondary bg-secondary/5'
                          : 'border-outline-variant hover:border-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="assignment"
                        checked={assignMode === opt.id}
                        onChange={() => setAssignMode(opt.id as AssignMode)}
                        className="mt-0.5 w-4 h-4 text-secondary border-outline-variant focus:ring-secondary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-background">{opt.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {assignMode === 'existing' && (
                  <div className="mt-4">
                    <EntitySearch
                      label="Search existing teams"
                      placeholder={
                        teamsLoading ? 'Loading teams…' : 'Type team name, department, or head…'
                      }
                      options={teamOptions}
                      value={selectedTeam}
                      onChange={setSelectedTeam}
                      disabled={teamsLoading}
                      emptyMessage="No teams match — try Create New Team"
                    />
                  </div>
                )}

                {assignMode === 'Individual' && (
                  <div className="mt-4">
                    <EntitySearch
                      label="Search employees"
                      placeholder={
                        employeesQuery.isLoading
                          ? 'Loading employees…'
                          : 'Type name, code, department, or role…'
                      }
                      options={employeeOptions}
                      value={selectedEmployee}
                      onChange={setSelectedEmployee}
                      disabled={employeesQuery.isLoading}
                      emptyMessage={
                        employeesQuery.isError ? 'Failed to load employees' : 'No employees match'
                      }
                    />
                    {employeesQuery.isError && (
                      <p className="text-body-sm text-error mt-1">
                        {getApiErrorMessage(employeesQuery.error, 'Could not load employees')}
                      </p>
                    )}
                  </div>
                )}

                {assignMode === 'new' && (
                  <p className="mt-4 text-body-sm text-on-surface-variant rounded-lg border border-outline-variant/50 bg-surface p-3">
                    On submit we create the project, then open <strong>Create Team</strong> with
                    employee search. The new team is linked to this project and you return to the
                    project page.
                  </p>
                )}
              </section>

              <div className="space-y-8">
                <section>
                  <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                    Initial Configuration
                  </h3>
                  <div className="space-y-4">
                    <Select
                      label="Phase"
                      value={phase}
                      onChange={(v) => setPhase(v as PhaseValue)}
                      options={ProjectPhaseOptions}
                      aria-label="Project phase"
                      minWidthClass="min-w-full"
                    />
                    <Select
                      label="Priority"
                      value={priority}
                      onChange={(v) => setPriority(v as PriorityValue)}
                      options={ProjectPriorityOptions}
                      aria-label="Project priority"
                      minWidthClass="min-w-full"
                    />
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                    Repository Details
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-background" htmlFor="repositoryUrl">
                        Git URL
                      </label>
                      <input
                        id="repositoryUrl"
                        type="url"
                        {...register('repositoryUrl')}
                        onKeyDown={(e) => handleEnterAdvance(e)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary/30 outline-none bg-surface-container-lowest text-on-background text-sm font-mono"
                        placeholder="https://github.com/org/repo"
                      />
                      {errors.repositoryUrl && (
                        <p className="text-body-sm text-error">{errors.repositoryUrl.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-background">Default Branch</label>
                      <input
                        type="text"
                        defaultValue="main"
                        onKeyDown={(e) => handleEnterAdvance(e)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary/30 outline-none bg-surface-container-lowest text-on-background text-sm font-mono"
                        placeholder="main"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {(formError || createMutation.isError) && (
              <p className="text-body-sm text-error" role="alert">
                {formError ??
                  getApiErrorMessage(createMutation.error, 'Failed to create project. Please try again.')}
              </p>
            )}
          </div>

          <div className="p-6 border-t border-outline-variant bg-surface flex justify-end gap-3 items-center">
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || createMutation.isPending}
              rightIcon={<span className="material-symbols-outlined text-sm">arrow_forward</span>}
            >
              {assignMode === 'new' ? 'Create project & new team' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
