import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { teams, membersFor } from '@/shared/mock/data/workforce'
import { safeNavigate } from '@/shared/lib/safeNavigate'
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
  const teamList = Object.values(teams)
  const t = teamList.find((x) => x.id === teamId) ?? teamList[0]
  const members = membersFor(t.id)
  const [name, setName] = useState(t.name)
  const [description, setDescription] = useState(t.description ?? t.mission ?? '')
  const [head, setHead] = useState(t.headName)
  const [status, setStatus] = useState(t.status)

  const save = () => {
    safeNavigate(navigate, { to: '/workforce/teams/$teamId', params: { teamId: t.id }, search: {} })
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
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
        <p className="text-body-md text-on-surface-variant">Update team identity, leadership, members, and status.</p>
      </div>

      <form
        className="bv-surface p-6 space-y-5"
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
                className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
                required
              />
            </label>
            <label className="block text-body-sm">
              <span className="text-on-surface-variant">Description / mission</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md resize-none focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              />
            </label>
            <label className="block text-body-sm">
              <span className="text-on-surface-variant">Department</span>
              <input
                defaultValue={t.department}
                className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
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
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            />
          </label>
          <label className="block text-body-sm mt-3">
            <span className="text-on-surface-variant">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-title-md font-semibold flex items-center gap-2">
              <Icon name="groups" className="text-secondary" /> Members
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Icon name="person_add" />}
              onClick={() =>
                safeNavigate(navigate, {
                  to: '/workforce/teams/$teamId/add-member',
                  params: { teamId: t.id },
                  search: {},
                })
              }
            >
              Add member
            </Button>
          </div>
          <ul className="divide-y divide-outline-variant/40 border border-outline-variant rounded-lg overflow-hidden">
            {members.slice(0, 8).map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface-container-lowest">
                <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-[10px] font-bold">
                  {m.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold truncate">{m.name}</p>
                  <p className="text-caption text-on-surface-variant">{m.role} · {m.title}</p>
                </div>
                <Link
                  to="/workforce/employees/$employeeId"
                  params={{ employeeId: String(m.id) }}
                  search={{}}
                  className="text-secondary text-label-sm font-semibold"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-caption text-on-surface-variant mt-2">
            Showing {Math.min(8, members.length)} of {t.memberCount} members. Use Add member to invite more.
          </p>
        </section>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              safeNavigate(navigate, {
                to: '/workforce/teams/$teamId',
                params: { teamId: t.id },
                search: {},
              })
            }
          >
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
