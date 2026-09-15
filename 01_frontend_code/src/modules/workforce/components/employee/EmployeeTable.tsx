import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Pagination, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { RowActions } from '@/shared/components/ui/RowActions'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { cn } from '@/shared/lib/cn'
import {
  employmentStateStyles,
  loginEnabledClass,
  loginDisabledClass,
} from '../../schemas/enums'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export type EmployeeListRow = {
  id: number
  fullName: string
  employee_code: string
  email?: string
  departmentName: string
  positionName: string
  employment_type: string
  current_state: string
  hasLogin?: boolean
  avatarInitials: string
}

type SelectionApi = {
  selectionMode: boolean
  isSelected: (id: string) => boolean
  allFilteredSelected: boolean
  toggleSelectAllFiltered: () => void
  toggleOne: (id: string) => void
  onRowPressStart: (id: string) => void
  onRowPressEnd: (id: string, onClick: () => void) => void
  onRowPressCancel: () => void
}

type Props = {
  pageItems: EmployeeListRow[]
  filteredCount: number
  totalItems: number
  loading: boolean
  isFetching: boolean
  page: number
  onPageChange: (p: number) => void
  selection: SelectionApi
  onOpenOverview: (emp: EmployeeListRow) => void
  onOpenDetail: (id: number) => void
}

export function EmployeeTable({
  pageItems,
  filteredCount,
  totalItems,
  loading,
  isFetching,
  page,
  onPageChange,
  selection,
  onOpenOverview,
  onOpenDetail,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: pageItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0

  return (
    <div className="bv-surface overflow-hidden relative">
      {(loading || isFetching) && (
        <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
          <TableSkeleton rows={6} />
        </div>
      )}
      {filteredCount === 0 && !loading ? (
        <div className="p-12 text-center space-y-3">
          <Icon name="person_search" className="text-4xl text-on-surface-variant" />
          <p className="text-title-lg font-semibold">No employees found</p>
          <p className="text-body-sm text-on-surface-variant">
            Try adjusting filters or add a new team member.
          </p>
        </div>
      ) : (
        <div ref={parentRef} className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-container-low border-b border-outline-variant shadow-sm">
              <tr>
                <th className="px-3 py-3 w-12 text-center">
                  {selection.selectionMode ? (
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-secondary"
                      checked={selection.allFilteredSelected}
                      onChange={selection.toggleSelectAllFiltered}
                      aria-label="Select all filtered employees on this page"
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Login
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {paddingTop > 0 && (
                <tr>
                  <td colSpan={8} style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const emp = pageItems[virtualRow.index]
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
                    onMouseUp={() => selection.onRowPressEnd(sid, () => onOpenOverview(emp))}
                    onMouseLeave={selection.onRowPressCancel}
                    onTouchStart={() => selection.onRowPressStart(sid)}
                    onTouchEnd={() => selection.onRowPressEnd(sid, () => onOpenOverview(emp))}
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
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-outline-variant"
                          aria-hidden
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                          {emp.avatarInitials}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface group-hover:text-secondary">
                            {emp.fullName}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {emp.employee_code}
                            {emp.email ? ` · ${emp.email}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-body-md">{emp.departmentName}</td>
                    <td className="px-4 py-4 text-body-md">{emp.positionName}</td>
                    <td className="px-4 py-4 text-body-md">
                      {emp.employment_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          employmentStateStyles[emp.current_state] ?? 'status-badge status-neutral'
                        }
                      >
                        {emp.current_state.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {emp.hasLogin ? (
                        <span className={loginEnabledClass}>Yes</span>
                      ) : (
                        <span className={loginDisabledClass}>No login</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-4 text-right"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end">
                        <RowActions
                          label={`Actions for ${emp.fullName}`}
                          actions={[
                            {
                              id: 'overview',
                              label: 'Quick view',
                              icon: 'visibility',
                              onClick: () => onOpenOverview(emp),
                            },
                            {
                              id: 'details',
                              label: 'View details',
                              icon: 'description',
                              onClick: () => onOpenDetail(emp.id),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td colSpan={8} style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={filteredCount}
        onPageChange={onPageChange}
        itemLabel="employees"
      />
      {filteredCount <= DEFAULT_PAGE_SIZE && filteredCount > 0 && (
        <div className="px-6 py-4 border-t border-outline-variant text-label-sm text-on-surface-variant">
          Showing {filteredCount} of {totalItems} employees
          {!selection.selectionMode && (
            <span className="ml-2 opacity-80">· Hold a row 3s to multi-select</span>
          )}
        </div>
      )}
    </div>
  )
}
