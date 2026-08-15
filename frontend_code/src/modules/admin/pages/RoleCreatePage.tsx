import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'

const PERMISSION_GROUPS = [
  {
    name: 'Users',
    items: ['users.read', 'users.manage', 'users.invite'],
  },
  {
    name: 'Roles',
    items: ['roles.read', 'roles.manage'],
  },
  {
    name: 'Settings',
    items: ['settings.read', 'settings.write'],
  },
  {
    name: 'Audit',
    items: ['audit.read'],
  },
]

export function RoleCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (p: string) => {
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/roles' })}
        className="flex items-center gap-2 text-secondary text-label-md hover:text-primary"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Roles
      </button>

      <PageHeader
        title="Add New Role"
        description="Create a role and select the permissions it grants."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/roles' })}>
              Cancel
            </Button>
            <Button variant="primary" size="sm">
              Create Role
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label className="text-label-sm font-bold text-on-surface-variant uppercase block mb-1">
                Role Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 bg-transparent"
                placeholder="e.g. Department Lead"
              />
            </div>
            <div>
              <label className="text-label-sm font-bold text-on-surface-variant uppercase block mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm min-h-[100px] outline-none focus:ring-2 focus:ring-secondary/30 bg-transparent"
                placeholder="What this role is for…"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
          <h3 className="text-title-lg font-semibold text-on-background mb-4">Permissions</h3>
          <div className="space-y-6">
            {PERMISSION_GROUPS.map((g) => (
              <div key={g.name}>
                <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  {g.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {g.items.map((p) => {
                    const on = selected.includes(p)
                    return (
                      <label
                        key={p}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-outline-variant cursor-pointer hover:bg-surface-container-low"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(p)}
                          className="rounded border-outline-variant text-secondary focus:ring-secondary"
                        />
                        <span className="text-body-sm font-mono">{p}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
