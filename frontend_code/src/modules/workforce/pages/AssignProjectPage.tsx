import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { teams } from '../data/mock'
import { assignableProjects } from '../data/teamExtraMock'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'

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
  const t = teams.find((x) => x.id === teamId) ?? teams[0]
  const [selected, setSelected] = useState<string | null>(null)
  const [role, setRole] = useState('Primary')
  const [notes, setNotes] = useState('')

  const submit = () => {
    navigate({ to: '/workforce/teams/$teamId/projects', params: { teamId: t.id } })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <BackButton to={`/workforce/teams/${t.id}`} label="Back to team" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: '/workforce/employees' },
            { label: 'Teams', to: '/workforce/teams' },
            { label: t.name, to: `/workforce/teams/${t.id}` },
            { label: 'Assign project' },
          ]}
        />
        <h1 className="text-headline-xl font-bold">Assign to Project</h1>
        <p className="text-body-md text-on-surface-variant">
          Link <strong>{t.name}</strong> to an active or planned project.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5 shadow-sm">
        <section>
          <h2 className="text-title-md font-semibold mb-3 flex items-center gap-2">
            <Icon name="account_tree" className="text-secondary" /> Select project
          </h2>
          <ul className="space-y-2">
            {assignableProjects.map((p) => {
              const active = selected === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      'w-full text-left rounded-lg border px-4 py-3 transition-colors',
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
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">Team role on project</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md"
            >
              <option>Primary</option>
              <option>Support</option>
              <option>Consulting</option>
            </select>
          </label>
          <label className="block text-body-sm sm:col-span-2">
            <span className="text-on-surface-variant">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md resize-none"
              placeholder="Optional context for project managers…"
            />
          </label>
        </section>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/workforce/teams/$teamId', params: { teamId: t.id } })}
          >
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={!selected} onClick={submit}>
            Assign team
          </Button>
        </div>
      </div>
    </div>
  )
}
