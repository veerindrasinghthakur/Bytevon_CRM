import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { DateRangeFilter } from '@/shared/components/forms/DateRangeFilter'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Pagination } from '@/shared/components/ui/Pagination'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myAdminRoutes } from '../../routes'
import { useUsersList } from '../../hooks/user/use-users'
import type { AdminUserListItem } from '../../types'
import { cn } from '@/shared/lib/cn'
import { statusBadgeClass, statusDot, userStatusOptions } from '../../schemas/enums'

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
        <QuickPersonRow initials={user.initials} roleLabel={user.role} name={user.name} />
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
    pageItems,
    totalCount,
    locked,
    active,
    departments,
    roles,
    isLoading,
    isFetching,
    isError,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    roleFilter,
    setRoleFilter,
    dateFrom,
    dateTo,
    setDateRange,
    filtersActive,
    resetFilters,
    page,
    setPage,
    pageSize,
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

  
  const goDetail = (u: AdminUserListItem) =>
    safeNavigate(navigate, { to: myAdminRoutes.usersDetail(String(u.id)), params: { userId: String(u.id) } })

  const goNew = () => safeNavigate(navigate, { to: myAdminRoutes.usersNew })

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
      onEdit: () => goDetail(u),
      editLabel: 'Edit user',
      actions:
        u.status === 'Locked'
          ? [{ id: 'unlock', label: 'Unlock', icon: 'lock_open', onClick: () => goDetail(u) }]
          : undefined,
      widthClass: 'max-w-[520px]',
    })
  }

  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  if (isError) {
    return (
      <ErrorState
        title="Could not load users"
        description="User list failed to load. Retry or go back."
        onRetry={() => void refetch()}
        onBack={() => safeNavigate(navigate, { to: myAdminRoutes.usersList })}
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
              resource={'user'}
              query={search.trim() || undefined}
              filters={{
                status: statusFilter !== 'All' ? statusFilter : undefined,
                department: departmentFilter !== 'All' ? departmentFilter : undefined,
                role: roleFilter !== 'All' ? roleFilter : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
              }}
              selectedIds={selectionMode ? Array.from(selectedIds) : undefined}
              filenameStem="users"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
              onClick={goNew}
            >
              Add New User
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="group"
          label="Total (filtered)"
          value={String(totalCount)}
          hint="Matching filters"
        />
        <MetricCard icon="bolt" label="Active" value={String(active)} hint="All accounts" />
        <MetricCard
          icon="lock_person"
          label="Locked"
          value={String(locked)}
          hint="Action required"
          valueClassName="text-error"
        />
        <MetricCard
          icon="person_off"
          label="This page"
          value={String(pageItems.length)}
          hint="Current page"
        />
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
          placeholder="Status"
          aria-label="Filter by status"
          options={[...userStatusOptions]}
          minWidthClass="min-w-[130px]"
        />
        <Select
          value={departmentFilter}
          onChange={setDepartmentFilter}
          placeholder="Department"
          aria-label="Filter by department"
          options={[
            { value: 'All', label: 'All Departments' },
            ...departments.map((d) => ({ value: d, label: d })),
          ]}
          minWidthClass="min-w-[150px]"
        />
        <Select
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="Role"
          aria-label="Filter by role"
          options={[
            { value: 'All', label: 'All Roles' },
            ...roles.map((r) => ({ value: r, label: r })),
          ]}
          minWidthClass="min-w-[140px]"
        />
        <DateRangeFilter
          value={{ from: dateFrom, to: dateTo }}
          onChange={({ from, to }) => setDateRange(from, to)}
          label="Last login"
        />
      </ListToolbar>

      {selectionMode && (
        <BulkSelectionBar
          selectedCount={selectedCount}
          filteredCount={pageItems.length}
          onCancel={exitSelectionMode}
        >
          <ExportButton
            resource={'user'}
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
                      aria-label="Select all users on this page"
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  User Identity
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Last Login
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
                          className={cn(
                            'inline-block w-2 h-2 rounded-full',
                            statusDot[u.status] ?? 'bg-outline-variant',
                          )}
                          title={u.status}
                          aria-label={`Status: ${u.status}`}
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-outline-variant text-label-sm text-on-surface-variant">
          Showing{' '}
          <span className="font-semibold text-on-background">
            {rangeFrom}–{rangeTo}
          </span>{' '}
          of <span className="font-semibold text-on-background">{totalCount}</span> users
          {!selectionMode && (
            <span className="ml-2 opacity-80">· Hold a row 3s to multi-select · open overview for actions</span>
          )}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalCount}
          onPageChange={setPage}
          itemLabel="users"
        />
      </section>
    </div>
  )
}
