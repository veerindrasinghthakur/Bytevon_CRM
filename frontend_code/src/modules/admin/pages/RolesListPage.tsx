import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { adminRoles } from '../data/mock'
import { getRoleListMetrics } from '../api/metrics'
import { cn } from '@/shared/lib/cn'

const categoryStyles: Record<string, string> = {
  'Core Role': 'bg-secondary/10 text-secondary',
  Operational: 'bg-primary/10 text-primary',
  Financial: 'bg-amber-100 text-amber-800',
  Standard: 'bg-surface-container text-on-surface-variant',
}

const STATUS_OPTIONS = ['All Status', 'Active', 'Archived'] as const
const CATEGORY_OPTIONS = ['All Categories', 'Core Role', 'Operational', 'Financial', 'Standard'] as const

export function RolesListPage() {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('All Status')
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_OPTIONS)[number]>('All Categories')

  const { data: metrics } = useQuery({
    queryKey: ['admin', 'metrics', 'roles'],
    queryFn: getRoleListMetrics,
  })

  const filtered = useMemo(() => {
    return adminRoles.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
      }
      if (statusFilter !== 'All Status' && r.status !== statusFilter) return false
      if (categoryFilter !== 'All Categories' && r.category !== categoryFilter) return false
      return true
    })
  }, [search, statusFilter, categoryFilter])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Roles & Permissions"
        description="Define RBAC roles and the permissions they grant."
        actions={
          <div className="flex gap-2">
            <ExportButton
              resource={ResourceName.ROLE}
              query={search.trim() || undefined}
              filters={{
                status: statusFilter !== 'All Status' ? statusFilter : undefined,
                category: categoryFilter !== 'All Categories' ? categoryFilter : undefined,
              }}
              filenameStem="roles"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
              onClick={() => navigate({ to: '/admin/roles/new' })}
            >
              Add Role
            </Button>
          </div>
        }
      />

      {/* Top metric cards — total roles, active users, etc. */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="badge"
          label="Total Roles"
          value={String(metrics?.totalRoles ?? adminRoles.length)}
          hint="All defined"
        />
        <MetricCard
          icon="verified_user"
          label="Active Roles"
          value={String(metrics?.activeRoles ?? adminRoles.filter((r) => r.status === 'Active').length)}
          hint="Assignable"
        />
        <MetricCard
          icon="group"
          label="Active Users"
          value={String(metrics?.activeUsers ?? 0)}
          hint="With roles"
        />
        <MetricCard
          icon="archive"
          label="Archived"
          value={String(metrics?.archivedRoles ?? 0)}
          hint="Inactive"
        />
      </section>

      {/* Filter bar */}
      <section className="bv-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <label className="block text-label-sm text-on-surface-variant mb-1.5">Search</label>
            <span className="material-symbols-outlined absolute left-3 bottom-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-body-sm transition-all duration-200"
              placeholder="Search roles by name or description..."
              type="text"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-label-sm text-on-surface-variant mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
              className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 bg-surface-container-lowest transition-colors"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-label-sm text-on-surface-variant mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as (typeof CATEGORY_OPTIONS)[number])}
              className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 bg-surface-container-lowest transition-colors"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setStatusFilter('All Status')
              setCategoryFilter('All Categories')
            }}
          >
            Clear
          </Button>
          <p className="text-label-sm text-on-surface-variant ml-auto self-center">
            Showing {filtered.length} of {adminRoles.length} roles
          </p>
        </div>
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

      {filtered.length === 0 && (
        <div className="bv-surface p-12 text-center text-on-surface-variant">No roles match your filters.</div>
      )}

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
