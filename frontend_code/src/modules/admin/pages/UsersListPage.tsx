import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Pagination, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { ResourceName } from '@/shared/schema'
import { useUsersList } from '../hooks/use-users-list'
import type { AdminUserListItem } from '../types'
import { cn } from '@/shared/lib/cn'

const statusBadgeClass: Record<string, string> = {
  Active: 'status-badge status-success',
  Inactive: 'status-badge status-neutral',
  Locked: 'status-badge status-error',
}

const statusDot: Record<string, string> = {
  Active: 'bg-emerald-500',
  Inactive: 'bg-slate-400',
  Locked: 'bg-red-500',
}

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Locked', label: 'Locked' },
]

function UserQuickContent({ user }: { user: AdminUserListItem }) {
  return (
    <>
      <QuickSection title="Identity">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="badge" label="Role" value={user.role} />
          <QuickMetaTile icon="domain" label="Department" value={user.department} />
          <QuickMetaTile icon="tag" label="Employee code" value={user.employeeCode} />
          <QuickMetaTile icon="schedule" label="Last login" value={user.lastLogin} />
        </div>
      </QuickSection>

      <QuickSection title="Assignment">
        <QuickPersonRow
          initials={user.initials}
          roleLabel={user.role}
          name={user.name}
        />
      </QuickSection>

      <QuickSection title="Related">
        <QuickRelatedRow icon="mail" label="Email" value={user.email} />
        <QuickRelatedRow icon="badge" label="Role" value={user.role} />
        <QuickRelatedRow icon="domain" label="Department" value={user.department} />
        <QuickRelatedRow
          icon="circle"
          label="Status"
          value={
            <span className={statusBadgeClass[user.status] ?? 'status-badge status-neutral'}>
              {user.status}
            </span>
          }
        />
      </QuickSection>
    </>
  )
}

export function UsersListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    items,
    filtered,
    pageItems,
    locked,
    active,
    isLoading,
    isFetching,
    isError,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtersActive,
    resetFilters,
    page,
    setPage,
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
  } = useUsersList()

  const goDetail = (u: AdminUserListItem) => {
    navigate({ to: '/admin/users/$userId', params: { userId: String(u.id) } } as any)
  }

  const openUserOverview = (u: AdminUserListItem) => {
    openPanel({
      title: u.name,
      subtitle: [u.email, u.employeeCode].filter(Boolean).join(' · '),
      icon: 'person',
      status: u.status,
      statusDotClass: statusDot[u.status] ?? 'bg-outline',
      content: <UserQuickContent user={u} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goDetail(u),
      widthClass: 'max-w-[520px]',
    })
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load users"
        description="User list failed to load. Retry or go back."
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        description="Login accounts linked to employments. Add user only for employees without credentials."
        actions={
          <div className="flex gap-2">
            <ExportButton
              resource={ResourceName.USER}
              query={search.trim() || undefined}
              filters={{ status: statusFilter !== 'All' ? statusFilter : undefined }}
              selectedIds={selectionMode ? Array.from(selectedIds) : undefined}
              filenameStem="users"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
              onClick={() => navigate({ to: '/admin/users/new' } as any)}
            >
              Add New User
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric icon="group" label="Total Users" value={String(items.length)} hint="From mock DB" />
        <Metric icon="bolt" label="Active" value={String(active)} hint="ACTIVE status" />
        <Metric
          icon="lock_person"
          label="Locked"
          value={String(locked)}
          hint="Action required"
          valueClass="text-error"
        />
        <Metric icon="person_off" label="Shown" value={String(filtered.length)} hint="After filter" />
      </section>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by name, email, role, or code..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          placeholder="All Status"
          options={STATUS_OPTIONS}
          minWidthClass="min-w-[130px]"
        />
      </ListToolbar>

      {selectionMode && (
        <BulkSelectionBar
          selectedCount={selectedCount}
          filteredCount={pageItems.length}
          onCancel={exitSelectionMode}
        >
          <ExportButton
            resource={ResourceName.USER}
            selectedIds={Array.from(selectedIds)}
            filenameStem="users-selected"
            label="Export selected"
          />
        </BulkSelectionBar>
      )}

      <section className="bv-surface overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
            <TableSkeleton rows={6} />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-3 py-3 w-12 text-center">
                  {selectionMode ? (
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-secondary"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      aria-label="Select all filtered users on this page"
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  User Identity
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {pageItems.map((u) => {
                const id = String(u.id)
                const selected = isSelected(id)
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      'select-none cursor-pointer',
                      selected ? 'bg-secondary/10' : 'zebra-row',
                    )}
                    onMouseDown={() => onRowPressStart(id)}
                    onMouseUp={() => onRowPressEnd(id, () => openUserOverview(u))}
                    onMouseLeave={onRowPressCancel}
                    onTouchStart={() => onRowPressStart(id)}
                    onTouchEnd={() => onRowPressEnd(id, () => openUserOverview(u))}
                    onTouchCancel={onRowPressCancel}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <td
                      className="px-3 py-4 text-center"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (selectionMode) toggleOne(id)
                      }}
                    >
                      {selectionMode ? (
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-secondary"
                          checked={selected}
                          onChange={() => toggleOne(id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-outline-variant"
                          aria-hidden
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                          {u.initials}
                        </div>
                        <div>
                          <p className="text-label-md font-semibold text-on-background">{u.name}</p>
                          <p className="text-body-sm text-on-surface-variant">
                            {u.email} · {u.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm">{u.role}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.department}</td>
                    <td className="px-6 py-4">
                      <span className={statusBadgeClass[u.status] ?? 'status-badge status-neutral'}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.lastLogin}</td>
                    <td
                      className="px-6 py-4 text-right"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end">
                        <RowActions
                          label={`Actions for ${u.name}`}
                          actions={[
                            {
                              id: 'overview',
                              label: 'Quick view',
                              icon: 'visibility',
                              onClick: () => openUserOverview(u),
                            },
                            {
                              id: 'details',
                              label: 'View details',
                              icon: 'description',
                              onClick: () => goDetail(u),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={DEFAULT_PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          itemLabel="users"
        />
        {filtered.length <= DEFAULT_PAGE_SIZE && (
          <div className="px-6 py-3 border-t border-outline-variant text-label-sm text-on-surface-variant">
            Showing {filtered.length} of {items.length} users
            {!selectionMode && (
              <span className="ml-2 opacity-80">· Hold a row 3s to multi-select</span>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  hint,
  valueClass,
}: {
  icon: string
  label: string
  value: string
  hint: string
  valueClass?: string
}) {
  return (
    <div className="bv-surface card-hover p-5">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 rounded-lg bg-secondary/15 text-secondary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-xs font-bold text-on-surface-variant">{hint}</span>
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-widest">{label}</p>
      <h3 className={cn('text-2xl font-black text-on-surface mt-1', valueClass)}>{value}</h3>
    </div>
  )
}
