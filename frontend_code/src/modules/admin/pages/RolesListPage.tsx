import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminRoles } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const categoryStyles: Record<string, string> = {
  'Core Role': 'bg-secondary/10 text-secondary',
  Operational: 'bg-primary/10 text-primary',
  Financial: 'bg-amber-100 text-amber-800',
  Standard: 'bg-surface-container text-on-surface-variant',
}

export function RolesListPage() {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = adminRoles.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Roles & Permissions"
        description="Define RBAC roles and the permissions they grant."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/admin/roles/new' })}
          >
            Add Role
          </Button>
        }
      />

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-full pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-body-sm transition-all duration-200"
            placeholder="Search roles..."
            type="text"
          />
        </div>
        <p className="text-label-sm text-on-surface-variant">
          Showing {filtered.length} of {adminRoles.length} roles
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((role) => (
          <div
            key={role.id}
            className={cn(
              'bv-surface p-6',
              'flex flex-col justify-between relative group w-full card-hover cursor-pointer'
            )}
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                className="p-1.5 hover:bg-surface-container rounded-full transition-colors duration-200 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenu(openMenu === role.id ? null : role.id)
                }}
                aria-label="Role actions"
              >
                <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
              </button>
              {openMenu === role.id && (
                <div className="absolute right-0 top-10 w-48 bg-white border border-outline-variant rounded-lg executive-shadow z-20 py-2">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null)
                      navigate({ to: '/admin/roles/$roleId', params: { roleId: role.id } })
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span> View Details
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null)
                      navigate({ to: '/admin/roles/$roleId/edit', params: { roleId: role.id } })
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span> Duplicate
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">block</span> Disable
                  </button>
                  <div className="h-px bg-outline-variant my-1" />
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-body-sm hover:bg-error-container text-error transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="text-left space-y-4 w-full cursor-pointer"
              onClick={() => navigate({ to: '/admin/roles/$roleId', params: { roleId: role.id } })}
            >
              <div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                    categoryStyles[role.category] ?? categoryStyles.Standard
                  )}
                >
                  {role.category}
                </span>
                <h3 className="text-title-lg font-semibold text-on-surface mt-2">{role.name}</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant line-clamp-2">{role.description}</p>

              <div className="flex items-center gap-4 py-2 border-y border-outline-variant/30">
                <div className="flex-1">
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Users</p>
                  <p className="text-title-lg font-semibold text-on-surface">
                    {String(role.usersCount).padStart(2, '0')}
                  </p>
                </div>
                <div className="flex-1 border-l border-outline-variant/30 pl-4">
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Permissions</p>
                  <p className="text-body-sm font-bold text-secondary">{role.coverageLabel}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-label-sm">
                  <span className="text-on-surface-variant">
                    {role.coveragePct === 100 ? 'System Health Check' : 'Access Coverage'}
                  </span>
                  <span className="text-on-surface">
                    {role.coveragePct === 100 ? '100% Secure' : `${role.coveragePct}%`}
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${role.coveragePct}%` }}
                  />
                </div>
              </div>
            </button>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-outline-variant/30">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant">Created: {role.created}</span>
                <span className="text-[10px] text-on-surface-variant">Updated: {role.updated}</span>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold',
                  role.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-surface-container text-on-surface-variant'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    role.status === 'Active' ? 'bg-green-600' : 'bg-on-surface-variant'
                  )}
                />
                {role.status.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between text-label-sm text-on-surface-variant pt-2">
        <span>
          Showing <span className="font-bold text-on-surface">1–{filtered.length}</span> of{' '}
          {adminRoles.length} roles
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Previous
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors duration-200 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
