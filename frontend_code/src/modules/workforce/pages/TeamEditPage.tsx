import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { teams } from '../data/mock'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function TeamEditPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const t = teams.find((x) => x.id === teamId) ?? teams[0]
  const [name, setName] = useState(t.name)
  const [description, setDescription] = useState(t.description ?? t.mission ?? '')
  const [head, setHead] = useState(t.headName)
  const [status, setStatus] = useState(t.status)

  const save = () => {
    navigate({ to: '/workforce/teams/$teamId', params: { teamId: t.id } })
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
            { label: 'Edit' },
          ]}
        />
        <h1 className="text-headline-xl font-bold">Edit Team</h1>
        <p className="text-body-md text-on-surface-variant">Update team identity, leadership, and status.</p>
      </div>

      <form
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <section>
          <h2 className="text-title-md font-semibold mb-3 flex items-center gap-2">
            <Icon name="badge" className="text-secondary" /> Team identity
          </h2>
          <div className="space-y-3">
            <label className="block text-body-sm">
              <span className="text-on-surface-variant">Team name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md"
                required
              />
            </label>
            <label className="block text-body-sm">
              <span className="text-on-surface-variant">Description / mission</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md resize-none"
              />
            </label>
            <label className="block text-body-sm">
              <span className="text-on-surface-variant">Department</span>
              <input
                defaultValue={t.department}
                className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-title-md font-semibold mb-3 flex items-center gap-2">
            <Icon name="star" className="text-secondary" /> Leadership
          </h2>
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">Team head</span>
            <input
              value={head}
              onChange={(e) => setHead(e.target.value)}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md"
            />
          </label>
          <label className="block text-body-sm mt-3">
            <span className="text-on-surface-variant">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </section>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/workforce/teams/$teamId', params: { teamId: t.id } })}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
