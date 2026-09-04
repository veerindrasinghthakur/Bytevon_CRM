import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { listAssignableProjects, listWorkforceTeams } from '../api/workforce'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { workforceRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'
import { assignProjectSchema, type AssignProjectForm } from '../schemas/assign-project-form'
import { TEAM_PROJECT_ROLE_OPTIONS } from '../schemas/enums'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function AssignProjectPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const teamList = listWorkforceTeams()
  const t = teamList.find((x) => x.id === teamId) ?? teamList[0]

  const form = useForm<AssignProjectForm>({
    resolver: zodResolver(assignProjectSchema),
    defaultValues: { projectId: '', role: 'Primary', notes: '' },
  })

  const selected = form.watch('projectId')

  const onSubmit = form.handleSubmit(() => {
    safeNavigate(navigate, {
      to: workforceRoutes.teamProjectsPath,
      params: { teamId: t.id },
    })
  })

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <BackButton to={workforceRoutes.teamDetail(t.id)} label="Back to team" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: workforceRoutes.employees },
            { label: 'Teams', to: workforceRoutes.teams },
            { label: t.name, to: workforceRoutes.teamDetail(t.id) },
            { label: 'Assign project' },
          ]}
        />
        <h1 className="text-headline-xl font-bold">Assign to Project</h1>
        <p className="text-body-md text-on-surface-variant">
          Link <strong>{t.name}</strong> to an active or planned project.
        </p>
      </div>

      <form className="bv-surface p-6 space-y-5" onSubmit={onSubmit}>
        <section>
          <h2 className="text-title-md font-semibold mb-3 flex items-center gap-2">
            <Icon name="account_tree" className="text-secondary" /> Select project
          </h2>
          <ul className="space-y-2">
            {listAssignableProjects().map((p) => {
              const active = selected === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => form.setValue('projectId', p.id, { shouldValidate: true })}
                    className={cn(
                      'w-full text-left rounded-lg border px-4 py-3 transition-all',
                      active
                        ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                        : 'border-outline-variant hover:bg-surface-container-low',
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-semibold text-body-sm">{p.name}</p>
                        <p className="text-caption text-on-surface-variant">{p.client}</p>
                      </div>
                      <span className="text-caption text-on-surface-variant">{p.status}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          {form.formState.errors.projectId && (
            <p className="text-xs text-error mt-2">{form.formState.errors.projectId.message}</p>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Team role on project"
            value={form.watch('role')}
            onChange={(v) => form.setValue('role', v)}
            options={[...TEAM_PROJECT_ROLE_OPTIONS]}
            minWidthClass="w-full"
            aria-label="Team role on project"
          />
          <label className="block text-body-sm sm:col-span-2">
            <span className="text-on-surface-variant">Notes</span>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md resize-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
              placeholder="Optional context for project managers…"
            />
          </label>
        </section>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              safeNavigate(navigate, {
                to: workforceRoutes.teamDetailPath,
                params: { teamId: t.id },
              })
            }
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Assign team
          </Button>
        </div>
      </form>
    </div>
  )
}
