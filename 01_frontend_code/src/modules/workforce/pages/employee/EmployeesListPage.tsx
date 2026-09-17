import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { Can } from '@/shared/rbac'
import { Action, ResourceName } from '@/shared/schema'
import { useEmployeesList } from '../../hooks/use-employees-list'
import { workforceRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { employmentStateDot } from '../../schemas/enums'
import { EmployeeQuickContent } from '../../components/employee/EmployeeQuickContent'
import { EmployeeStatsCards } from '../../components/employee/EmployeeStatsCards'
import { EmployeeFilters } from '../../components/employee/EmployeeFilters'
import { EmployeeTable, type EmployeeListRow } from '../../components/employee/EmployeeTable'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function EmployeesListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    items,
    filtered,
    pageItems,
    metrics,
    departments,
    states,
    types,
    loading,
    isFetching,
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
    page,
    setPage,
    reload,
  } = useEmployeesList()

  const selection = useListSelection({
    items: pageItems,
    getId: (e) => String(e.id),
  })

  const goDetail = (id: number) => {
    safeNavigate(navigate, {
      to: workforceRoutes.employeeDetailPath,
      params: { employeeId: String(id) },
    })
  }

  const goNew = () => safeNavigate(navigate, { to: workforceRoutes.employeeNew })

  const openEmployeeOverview = (emp: EmployeeListRow) => {
    openPanel({
      title: emp.fullName,
      subtitle: [emp.employee_code, emp.email].filter(Boolean).join(' · '),
      icon: 'person',
      status: emp.current_state.replace(/_/g, ' '),
      statusDotClass: employmentStateDot[emp.current_state] ?? 'bg-outline',
      content: (
        <EmployeeQuickContent
          departmentName={emp.departmentName}
          positionName={emp.positionName}
          employment_type={emp.employment_type}
          hasLogin={emp.hasLogin}
          email={emp.email}
        />
      ),
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goDetail(emp.id),
      widthClass: 'max-w-[520px]',
    })
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load employees"
        description="Employee directory failed to load. Retry or go back."
        onRetry={() => void reload()}
        onBack={() => safeNavigate(navigate, { to: workforceRoutes.employees })}
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
              <Button variant="primary" leftIcon={<Icon name="add" />} onClick={goNew}>
                Add Employee
              </Button>
            </Can>
          </div>
        }
      />

      <EmployeeStatsCards
        total={metrics.total}
        active={metrics.active}
        archived={metrics.archived}
      />

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={pageItems.length}
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

      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptChange={setDeptFilter}
        stateFilter={stateFilter}
        onStateChange={setStateFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        departments={departments}
        states={states}
        types={types}
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
      />

      <EmployeeTable
        pageItems={pageItems}
        filteredCount={filtered.length}
        totalItems={items.length}
        loading={loading}
        isFetching={isFetching}
        page={page}
        onPageChange={setPage}
        selection={selection}
        onOpenOverview={openEmployeeOverview}
        onOpenDetail={goDetail}
      />
    </div>
  )
}
