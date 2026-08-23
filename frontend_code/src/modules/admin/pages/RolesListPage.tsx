import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { IconButton } from '@/shared/components/ui/IconButton'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { ResourceName } from '@/shared/schema'
import { useRolesList } from '../hooks/use-roles-list'
import type { AdminRole } from '../types'
import { cn } from '@/shared/lib/cn'

const categoryStyles: Record<string, string> = {
  'Core Role': 'bg-secondary/10 text-secondary',
  Operational: 'bg-primary/10 text-primary',
  Financial: 'status-badge status-warning',
  Standard: 'status-badge status-neutral',
}

function RoleQuickContent({ role }: { role: AdminRole }) {
  return (
    <>
      <QuickSection title="Quick Statistics">
        <QuickStatGrid>
          <QuickStat icon="group" value={String(role.usersCount).padStart(2, '0')} label="Users" />
          <QuickStat icon="shield" value={`${role.coveragePct}%`} label="Coverage" />
          <QuickStat icon="category" value={role.category} label="Category" />
        </QuickStatGrid>
      </QuickSection>

      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile
            icon="category"
            label="Category"
            value={
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                  categoryStyles[role.category] ?? categoryStyles.Standard,
                )}
              >
                {role.category}
              </span>
            }
          />
          <QuickMetaTile
            icon="toggle_on"
            label="Status"
            value={
              <span
                className={cn(
                  'inline-flex items-center gap-1.5',
                  role.status === 'Active' ? 'status-badge status-success' : 'status-badge status-neutral',
                )}
              >
                {role.status}
              </span>
            }
          />
          <QuickMetaTile icon="event" label="Created" value={role.created} />
          <QuickMetaTile icon="update" label="Updated" value={role.updated} />
        </div>
        {role.description && (
          <p className="mt-3 text-body-sm text-on-surface-variant">{role.description}</p>
        )}
      </QuickSection>

      <QuickSection title="Access coverage">
        <div className="space-y-2">
          <div className="flex justify-between text-label-sm">
            <span className="text-on-surface-variant">{role.coverageLabel}</span>
            <span className="text-on-surface">{role.coveragePct}%</span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${role.coveragePct}%` }}
            />
          </div>
        </div>
      </QuickSection>

      <QuickSection title="Related">
        <QuickRelatedRow icon="group" label="Users" value={String(role.usersCount)} />
        <QuickRelatedRow icon="shield" label="Coverage" value={role.coverageLabel} />
        <QuickRelatedRow icon="badge" label="Role" value={role.name} />
      </QuickSection>
    </>
  )
}

export function RolesListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const {
    filtered,
    totalCount,
    isLoading,
    isError,
    refetch,
    metrics,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    statusOptions,
    categoryOptions,
    resetFilters,
    selectionMode,
    selectedIds,
    selectedCount,
    allFilteredSelected,
    isSelected,
    toggleOne,
    toggleSelectAllFiltered,
    exitSelectionMode,
    onRowPressStart,
    onRowPressEnd,
    onRowPressCancel,
  } = useRolesList()

  const goDetail = (roleId: string) =>
    navigate({ to: '/admin/roles/$roleId', params: { roleId } })

  const openRoleOverview = (role: AdminRole) => {
    openPanel({
      title: role.name,
      subtitle: role.category,
      icon: 'badge',
      status: role.status,
      statusDotClass: role.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
      content: <RoleQuickContent role={role} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goDetail(role.id),
      widthClass: 'max-w-[520px]',
    })
  }

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
                status: statusFilter !== 'All' ? statusFilter : undefined,
                category: categoryFilter !== 'All' ? categoryFilter : undefined,
              }}
              selectedIds={selectionMode ? Array.from(selectedIds) : undefined}
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

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="badge"
          label="Total Roles"
          value={String(metrics?.totalRoles ?? totalCount)}
          hint="All defined"
        />
        <MetricCard
          icon="verified_user"
          label="Active Roles"
          value={String(metrics?.activeRoles ?? 0)}
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

      <section className="bv-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <label className="block text-label-sm text-on-surface-variant mb-1.5" htmlFor="roles-search">
              Search
            </label>
            <span className="material-symbols-outlined absolute left-3 bottom-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              id="roles-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-body-sm transition-all duration-200"
              placeholder="Search roles by name or description..."
              type="text"
            />
          </div>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={statusOptions.map((o) => ({
              value: o,
              label: o === 'All' ? 'All Status' : o,
            }))}
            minWidthClass="min-w-[140px]"
          />
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
            options={categoryOptions.map((o) => ({
              value: o,
              label: o === 'All' ? 'All Categories' : o,
            }))}
            minWidthClass="min-w-[160px]"
          />
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Clear
          </Button>
          <p className="text-label-sm text-on-surface-variant ml-auto self-center">
            Showing {filtered.length} of {totalCount} roles
          </p>
        </div>
      </section>

      {selectionMode && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5">
          <label className="flex items-center gap-2 text-body-sm font-semibold text-on-surface cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-outline-variant text-secondary"
              checked={allFilteredSelected}
              onChange={toggleSelectAllFiltered}
              aria-label="Select all filtered roles"
            />
            {selectedCount} selected
            <span className="text-on-surface-variant font-normal"> (of {filtered.length} shown)</span>
          </label>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={exitSelectionMode}>
            Cancel
          </Button>
          <ExportButton
            resource={ResourceName.ROLE}
            selectedIds={Array.from(selectedIds)}
            filenameStem="roles-selected"
            label="Export selected"
          />
        </div>
      )}

      {isLoading && <TableSkeleton rows={6} />}

      {isError && (
        <ErrorState
          title="Failed to load roles"
          description="We could not load the roles list. Check your connection and try again."
          onRetry={() => void refetch()}
          showBack={false}
        />
      )}

      {!isLoading && !isError && (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((role) => {
              const selected = isSelected(role.id)
              return (
                <div
                  key={role.id}
                  className={cn(
                    'bv-surface p-6',
                    'flex flex-col justify-between relative group w-full card-hover cursor-pointer select-none',
                    selected && 'ring-2 ring-secondary bg-secondary/5',
                  )}
                  onMouseDown={() => onRowPressStart(role.id)}
                  onMouseUp={() => onRowPressEnd(role.id, () => openRoleOverview(role))}
                  onMouseLeave={onRowPressCancel}
                  onTouchStart={() => onRowPressStart(role.id)}
                  onTouchEnd={() => onRowPressEnd(role.id, () => openRoleOverview(role))}
                  onTouchCancel={onRowPressCancel}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {selectionMode && (
                    <div
                      className="absolute top-4 left-4 z-10"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOne(role.id)
                      }}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-secondary"
                        checked={selected}
                        onChange={() => toggleOne(role.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${role.name}`}
                      />
                    </div>
                  )}

                  <div className="absolute top-4 right-4 z-10" onMouseDown={(e) => e.stopPropagation()}>
                    <IconButton
                      label={`Actions for ${role.name}`}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenu(openMenu === role.id ? null : role.id)
                      }}
                    >
                      <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                    </IconButton>
                    {openMenu === role.id && (
                      <div className="absolute right-0 top-10 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg executive-shadow z-20 py-2">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            setOpenMenu(null)
                            openRoleOverview(role)
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span> Quick view
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            setOpenMenu(null)
                            goDetail(role.id)
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">description</span> View Details
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
                    onClick={() => {
                      if (selectionMode) {
                        toggleOne(role.id)
                        return
                      }
                      openRoleOverview(role)
                    }}
                  >
                    <div>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                          categoryStyles[role.category] ?? categoryStyles.Standard,
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
                        'flex items-center gap-1.5',
                        role.status === 'Active' ? 'status-badge status-success' : 'status-badge status-neutral',
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          role.status === 'Active' ? 'bg-[var(--color-success-emerald)]' : 'bg-on-surface-variant',
                        )}
                      />
                      {role.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {filtered.length === 0 && (
            <div className="bv-surface p-12 text-center text-on-surface-variant">No roles match your filters.</div>
          )}

          <div className="flex items-center justify-between text-label-sm text-on-surface-variant pt-2">
            <span>
              Showing <span className="font-bold text-on-surface">1–{filtered.length}</span> of {totalCount}{' '}
              roles
              {!selectionMode && (
                <span className="ml-2 text-on-surface-variant/80">· Hold a card 3s to multi-select</span>
              )}
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
        </>
      )}
    </div>
  )
}
