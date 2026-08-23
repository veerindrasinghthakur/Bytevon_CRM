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
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { Can } from '@/shared/rbac'
import { Action, ResourceName } from '@/shared/schema'
import { useDepartmentsList } from '../hooks/use-departments-list'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function DepartmentQuickContent({
  name,
  code,
  headName,
  staffCount,
  status,
}: {
  name: string
  code?: string
  headName?: string
  staffCount?: number
  status: string
}) {
  return (
    <>
      <QuickSection title="Quick Statistics">
        <QuickStatGrid>
          <QuickStat icon="groups" value={staffCount ?? 0} label="Staff" />
          <QuickStat icon="badge" value={code ?? '—'} label="Code" />
          <QuickStat icon="toggle_on" value={status} label="Status" />
        </QuickStatGrid>
      </QuickSection>

      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="domain" label="Department" value={name} />
          <QuickMetaTile icon="tag" label="Code" value={code ?? '—'} />
          <QuickMetaTile
            icon="toggle_on"
            label="Status"
            value={
              <span
                className={cn(
                  'inline-flex px-3 py-1 rounded-full text-label-sm font-medium',
                  status === 'Active'
                    ? 'bg-secondary/10 text-secondary'
                    : 'bg-surface-container-high text-outline',
                )}
              >
                {status}
              </span>
            }
          />
        </div>
      </QuickSection>

      <QuickSection title="Leadership">
        {headName ? (
          <QuickPersonRow
            initials={headName
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
            roleLabel="Department Head"
            name={headName}
          />
        ) : (
          <QuickRelatedRow icon="person_off" label="Head" value="Unassigned" />
        )}
      </QuickSection>

      <QuickSection title="Related">
        <QuickRelatedRow icon="groups" label="Staff" value={String(staffCount ?? 0)} />
        <QuickRelatedRow icon="domain" label="Department" value={name} />
      </QuickSection>
    </>
  )
}

export function DepartmentsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    items,
    filtered,
    metrics,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    reload,
  } = useDepartmentsList()

  const selection = useListSelection({
    items: filtered,
    getId: (d) => String(d.id),
  })

  const goDetail = (id: number) => {
    navigate({
      to: '/workforce/departments/$departmentId',
      params: { departmentId: String(id) },
    })
  }

  const openDeptOverview = (d: (typeof filtered)[number]) => {
    openPanel({
      title: d.name,
      subtitle: d.code,
      icon: 'domain',
      status: d.status,
      statusDotClass: d.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
      content: (
        <DepartmentQuickContent
          name={d.name}
          code={d.code}
          headName={d.headName}
          staffCount={d.staffCount}
          status={d.status}
        />
      ),
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goDetail(d.id),
      widthClass: 'max-w-[520px]',
    })
  }

  if (loading) return <PageLoadingSkeleton />
  if (error) {
    return (
      <ErrorState
        title="Could not load departments"
        description="Department data failed to load. Retry or go back."
        onRetry={() => void reload()}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Department Management"
        description="Organize structure, heads, and staffing across the organization."
        actions={
          <div className="flex gap-2 flex-wrap">
            <ExportButton
              resource={ResourceName.DEPARTMENT}
              query={search}
              filters={{ status }}
              selectedIds={selection.selectionMode ? Array.from(selection.selectedIds) : undefined}
              filenameStem="departments"
            />
            <Can action={Action.CREATE} resource={ResourceName.DEPARTMENT}>
              <Button
                variant="primary"
                leftIcon={<Icon name="add" />}
                onClick={() => navigate({ to: '/workforce/departments/new' })}
              >
                Add Department
              </Button>
            </Can>
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Departments" value={String(metrics.total)} icon="domain" />
        <MetricCard label="Total Staffing" value={String(metrics.staffing)} icon="groups" />
        <MetricCard label="Active" value={String(metrics.active)} icon="check_circle" valueClassName="text-secondary" />
        <MetricCard label="Inactive / Archived" value={String(metrics.inactive)} icon="archive" />
      </section>

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={filtered.length}
          onCancel={selection.exitSelectionMode}
        >
          <ExportButton
            resource={ResourceName.DEPARTMENT}
            selectedIds={Array.from(selection.selectedIds)}
            filenameStem="departments-selected"
            label="Export selected"
          />
        </BulkSelectionBar>
      )}

      <div className="bv-surface p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
            placeholder="Search departments..."
          />
        </div>
        <Select
          value={status}
          onChange={setStatus}
          placeholder="All Statuses"
          options={[
            { value: 'All', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {filtered.length === 0 && (
        <div className="bv-surface p-16 text-center space-y-3">
          <Icon name="domain_disabled" className="text-5xl text-on-surface-variant" />
          <h3 className="text-title-lg font-semibold text-on-background">No departments found</h3>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            {search || status !== 'All'
              ? 'Try clearing filters or search.'
              : 'Create your first department to organize staff and reporting lines.'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bv-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-3 py-4 w-12 text-center">
                    {selection.selectionMode ? (
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-secondary"
                        checked={selection.allFilteredSelected}
                        onChange={selection.toggleSelectAllFiltered}
                        aria-label="Select all filtered departments"
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
                  </th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Department Name</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Department Head</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-center">Staff</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((d) => {
                  const sid = String(d.id)
                  const isSelected = selection.isSelected(sid)
                  return (
                    <tr
                      key={d.id}
                      className={cn(
                        'cursor-pointer group select-none',
                        isSelected ? 'bg-secondary/10' : 'zebra-row',
                      )}
                      onMouseDown={() => selection.onRowPressStart(sid)}
                      onMouseUp={() => selection.onRowPressEnd(sid, () => openDeptOverview(d))}
                      onMouseLeave={selection.onRowPressCancel}
                      onTouchStart={() => selection.onRowPressStart(sid)}
                      onTouchEnd={() => selection.onRowPressEnd(sid, () => openDeptOverview(d))}
                      onTouchCancel={selection.onRowPressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <td
                        className="px-3 py-5 text-center"
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
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              d.status === 'Active'
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-surface-container-highest text-outline',
                            )}
                          >
                            <Icon name="domain" className="text-xl" />
                          </div>
                          <span className="font-semibold text-on-surface text-title-lg">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-on-surface-variant">{d.code}</td>
                      <td className="px-6 py-5">
                        <span className="text-label-md">{d.headName}</span>
                      </td>
                      <td className="px-6 py-5 text-center">{d.staffCount}</td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-medium',
                            d.status === 'Active'
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-surface-container-high text-outline',
                          )}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-5 text-right"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="p-2 hover:bg-secondary/10 rounded-lg text-on-surface-variant transition-colors"
                          onClick={() => openDeptOverview(d)}
                          aria-label={`Quick view ${d.name}`}
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
          <div className="px-6 py-4 border-t border-outline-variant text-body-sm text-on-surface-variant">
            Showing {filtered.length} of {items.length} departments
            {!selection.selectionMode && (
              <span className="ml-2 opacity-80">· Hold a row 3s to multi-select</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
