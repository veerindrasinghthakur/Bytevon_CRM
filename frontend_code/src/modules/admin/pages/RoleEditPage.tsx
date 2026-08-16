import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminRoles } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'Import', 'Manage'] as const
const MODULES = [
  'Dashboard',
  'Employees',
  'CRM',
  'Sales',
  'Inventory',
  'Reports',
  'Administration',
  'Attendance',
  'Leave',
  'Payroll',
]

type Action = (typeof ACTIONS)[number]

function seedMatrix(permissions: string[]) {
  const init: Record<string, Record<Action, boolean>> = {}
  MODULES.forEach((m) => {
    const hasAny = permissions.some((p) => p.toLowerCase().includes(m.toLowerCase().slice(0, 4)))
    init[m] = Object.fromEntries(
      ACTIONS.map((a) => [a, hasAny && (a === 'View' || a === 'Create' || a === 'Edit')])
    ) as Record<Action, boolean>
  })
  if (permissions.some((p) => p.includes('manage') || p.includes('security'))) {
    MODULES.forEach((m) => {
      init[m] = Object.fromEntries(ACTIONS.map((a) => [a, true])) as Record<Action, boolean>
    })
  }
  return init
}

export function RoleEditPage() {
  const { roleId } = useParams({ strict: false }) as { roleId?: string }
  const navigate = useNavigate()
  const role = adminRoles.find((r) => r.id === roleId) ?? adminRoles[0]

  const [name, setName] = useState(role.name)
  const [description, setDescription] = useState(role.description)
  const [active, setActive] = useState(role.status === 'Active')
  const [matrix, setMatrix] = useState(() => seedMatrix(role.permissions))

  const toggleCell = (mod: string, action: Action) => {
    setMatrix((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod][action] },
    }))
  }

  const toggleRowAll = (mod: string) => {
    const allOn = ACTIONS.every((a) => matrix[mod][a])
    setMatrix((prev) => ({
      ...prev,
      [mod]: Object.fromEntries(ACTIONS.map((a) => [a, !allOn])) as Record<Action, boolean>,
    }))
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/roles/$roleId', params: { roleId: role.id } })}
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        <span className="text-label-md font-medium">Back to Role Detail</span>
      </button>

      <PageHeader
        title={`Edit Role: ${role.name}`}
        description="Update functional access levels and module permissions."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/admin/roles/$roleId', params: { roleId: role.id } })}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-outline-variant">
              <span className="material-symbols-outlined text-secondary">badge</span>
              <h3 className="text-title-lg font-semibold text-primary">Role Identity</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Role Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-sm min-h-[100px] outline-none focus:border-secondary bg-transparent"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <div>
                  <p className="text-label-md text-primary font-medium">Role Status</p>
                  <p className="text-label-sm text-on-surface-variant">{role.usersCount} users assigned</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  onClick={() => setActive(!active)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    active ? 'bg-secondary' : 'bg-outline-variant'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                      active ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-8">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">grid_view</span>
                <h3 className="text-title-lg font-semibold text-primary">Module Permissions Matrix</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 border-b border-outline-variant text-label-md text-primary w-1/4">
                      Module
                    </th>
                    {ACTIONS.map((a) => (
                      <th
                        key={a}
                        className="px-3 py-4 border-b border-outline-variant text-label-sm text-on-surface-variant text-center"
                      >
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {MODULES.map((mod) => (
                    <tr key={mod} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-label-md text-primary font-medium">{mod}</span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-outline-variant text-secondary h-3 w-3"
                              checked={ACTIONS.every((a) => matrix[mod][a])}
                              onChange={() => toggleRowAll(mod)}
                            />
                            <span className="text-[10px] text-on-surface-variant">All</span>
                          </label>
                        </div>
                      </td>
                      {ACTIONS.map((a) => (
                        <td key={a} className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-secondary cursor-pointer"
                            checked={matrix[mod][a]}
                            onChange={() => toggleCell(mod, a)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
