import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { Can } from '@/shared/rbac'
import { Action, ResourceName } from '@/shared/schema'
import { useEmployeesList } from '../hooks/use-employees-list'
import { cn } from '@/shared/lib/cn'

const stateStyles: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  ONBOARDING: 'bg-blue-100 text-blue-800 border-blue-200',
  PROBATION: 'bg-amber-100 text-amber-800 border-amber-200',
  SERVING_NOTICE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RESIGNED: 'bg-slate-100 text-slate-600 border-slate-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  ALUMNI: 'bg-slate-100 text-slate-600 border-slate-200',
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function EmployeesListPage() {
  const navigate = useNavigate()
  const {
    items,
    filtered,
    metrics,
    departments,
    states,
    types,
    loading,
    error,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    stateFilter,
    setStateFilter,
    typeFilter,
    setTypeFilter,
    filtersActive,
    resetFilters,
    reload,
  } = useEmployeesList()

  const selection = useListSelection({
    items: filtered,
    getId: (e) => String(e.id),
  })

  const goDetail = (id: number) => {
    navigate({
      to: '/workforce/employees/$employeeId',
      params: { employeeId: String(id) },
    })
  }

  if (loading) return <PageLoadingSkeleton />
  if (error) {
    return (
      <ErrorState
        title="Could not load employees"
        description="Employee directory failed to load. Retry or go back."
        onRetry={() => void reload()}
      />
    )
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Employee Management"
        description="Manage and organize all human capital records within the organization."
        actions={
          <div className="flex gap-2 flex-wrap">
            <ExportButton
              resource={ResourceName.EMPLOYMENT}
              query={search}
              filters={{ department: deptFilter, state: stateFilter, type: typeFilter }}
              selectedIds={selection.selectionMode ? Array.from(selection.selectedIds) : undefined}
              filenameStem="employees"
            />
            <Can action={Action.CREATE} resource={ResourceName.EMPLOYMENT}>
              <Button
                variant="primary"
                leftIcon={<Icon name="add" />}
                onClick={() => navigate({ to: '/workforce/employees/new' })}
              >
                Add Employee
              </Button>
            </Can>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl ml-auto">
        <MetricCard label="Total" value={metrics.total} icon="groups" />
        <MetricCard label="Active" value={metrics.active} icon="check_circle" valueClassName="text-secondary" />
        <MetricCard label="Archived" value={metrics.archived} icon="archive" />
      </div>

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={filtered.length}
          onCancel={selection.exitSelectionMode}
        >
          <ExportButton
            resource={ResourceName.EMPLOYMENT}
            selectedIds={Array.from(selection.selectedIds)}
            filenameStem="employees-selected"
            label="Export selected"
          />
        </BulkSelectionBar>
      )}

      <div className="bv-surface p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="person_search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            placeholder="Search by Name, Code, Email, or Department..."
          />
        </div>
        <Select
          value={deptFilter}
          onChange={setDeptFilter}
          placeholder="All Departments"
          options={[
            { value: 'all', label: 'All Departments' },
            ...departments.map((d) => ({ value: d.name, label: d.name })),
          ]}
        />
        <Select
          value={stateFilter}
          onChange={setStateFilter}
          placeholder="All Statuses"
          options={[
            { value: 'all', label: 'All Statuses' },
            ...states.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          ]}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All Types"
          options={[
            { value: 'all', label: 'All Types' },
            ...types.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
          ]}
        />
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="bv-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Icon name="person_search" className="text-4xl text-on-surface-variant" />
            <p className="text-title-lg font-semibold">No employees found</p>
            <p className="text-body-sm text-on-surface-variant">Try adjusting filters or add a new team member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-3 py-3 w-12 text-center">
                    {selection.selectionMode ? (
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-secondary"
                        checked={selection.allFilteredSelected}
                        onChange={selection.toggleSelectAllFiltered}
                        aria-label="Select all filtered employees"
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Login</th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filtered.map((emp) => {
                  const sid = String(emp.id)
                  const isSelected = selection.isSelected(sid)
                  return (
                    <tr
                      key={emp.id}
                      className={cn(
                        'cursor-pointer group select-none',
                        isSelected ? 'bg-secondary/10' : 'zebra-row',
                      )}
                      onMouseDown={() => selection.onRowPressStart(sid)}
                      onMouseUp={() => selection.onRowPressEnd(sid, () => goDetail(emp.id))}
                      onMouseLeave={selection.onRowPressCancel}
                      onTouchStart={() => selection.onRowPressStart(sid)}
                      onTouchEnd={() => selection.onRowPressEnd(sid, () => goDetail(emp.id))}
                      onTouchCancel={selection.onRowPressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <td
                        className="px-3 py-4 text-center"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selection.selectionMode) selection.toggleOne(sid)
                        }}
                      >
                        {selection.selectionMode ? (
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-secondary"
                            checked={isSelected}
                            onChange={() => selection.toggleOne(sid)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-outline-variant" aria-hidden />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                            {emp.avatarInitials}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface group-hover:text-secondary">{emp.fullName}</p>
                            <p className="text-label-sm text-on-surface-variant">
                              {emp.employee_code}
                              {emp.email ? ` · ${emp.email}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-body-md">{emp.departmentName}</td>
                      <td className="px-4 py-4 text-body-md">{emp.positionName}</td>
                      <td className="px-4 py-4 text-body-md">{emp.employment_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-bold border',
                            stateStyles[emp.current_state] ?? 'bg-surface-container',
                          )}
                        >
                          {emp.current_state.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {emp.hasLogin ? (
                          <span className="text-label-sm text-emerald-700 font-medium">Yes</span>
                        ) : (
                          <span className="text-label-sm text-amber-700 font-medium">No login</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-4 text-right"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
                          onClick={() => goDetail(emp.id)}
                        >
                          <Icon name="visibility" className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-4 border-t border-outline-variant text-label-sm text-on-surface-variant">
          Showing {filtered.length} of {items.length} employees
          {!selection.selectionMode && (
            <span className="ml-2 opacity-80">· Hold a row 3s to multi-select</span>
          )}
        </div>
      </div>
    </div>
  )
}
