import { useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { DateRangeFilter } from '@/shared/components/forms/DateRangeFilter'
import { TimeRangeFilter } from '@/shared/components/forms/TimeRangeFilter'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { ResourceName } from '@/shared/schema'
import { queryKeys } from '@/shared/lib/query-keys'
import { listAuditLogs } from '../api/audit'
import type { AuditLog } from '../types'
import { auditActionBadge, auditActionDot, resolveAuditActionKey } from '../schemas/enums'
import { cn } from '@/shared/lib/cn'
import { MetricCard } from '@/shared/components/ui/MetricCard'

type AuditFilters = {
  action: string
  module: string
  dateFrom: string
  dateTo: string
  timeFrom: string
  timeTo: string
}

const FILTER_DEFAULTS: AuditFilters = {
  action: 'All Actions',
  module: 'All Modules',
  dateFrom: '',
  dateTo: '',
  timeFrom: '',
  timeTo: '',
}

const ACTION_OPTIONS = ['All Actions', 'Create', 'Update', 'Delete', 'Login', 'Lock']
const MODULE_OPTIONS = ['All Modules', 'Roles', 'Auth', 'Settings', 'Users']

function AuditQuickContent({ log }: { log: AuditLog }) {
  return (
    <>
      <QuickSection title="Actor">
        <QuickPersonRow initials={log.actorInitials} roleLabel="Actor" name={log.actor} />
      </QuickSection>
      <QuickSection title="Event details">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="tag" label="Event ID" value={log.id} />
          <QuickMetaTile
            icon="bolt"
            label="Action"
            value={
              <span className={auditActionBadge[resolveAuditActionKey(log.action)] ?? 'status-badge status-neutral'}>
                {log.action}
              </span>
            }
          />
          <QuickMetaTile icon="category" label="Module" value={log.module} />
          <QuickMetaTile icon="schedule" label="Timestamp" value={log.timestamp} />
        </div>
      </QuickSection>
      <QuickSection title="Related">
        <QuickRelatedRow icon="description" label="Target" value={log.target} />
        <QuickRelatedRow icon="lan" label="IP Address" value={log.ip} />
        <QuickRelatedRow icon="category" label="Module" value={log.module} />
      </QuickSection>
    </>
  )
}

export function AuditLogsPage() {
  const { openPanel } = useQuickOverview()

  const controls = useListControls<AuditFilters>({
    filterDefaults: FILTER_DEFAULTS,
  })

  const listParams = useMemo(
    () => ({
      search: controls.debouncedSearch || undefined,
      action: controls.filters.action !== 'All Actions' ? controls.filters.action : undefined,
      module: controls.filters.module !== 'All Modules' ? controls.filters.module : undefined,
      dateFrom: controls.filters.dateFrom || undefined,
      dateTo: controls.filters.dateTo || undefined,
      timeFrom: controls.filters.timeFrom || undefined,
      timeTo: controls.filters.timeTo || undefined,
    }),
    [controls.debouncedSearch, controls.filters],
  )

  const logsQuery = useQuery({
    queryKey: queryKeys.admin.audit.list(listParams),
    queryFn: () => listAuditLogs({ limit: 500, ...listParams }),
  })

  const auditLogs = logsQuery.data ?? []
  const filtered = auditLogs

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0

  const selection = useListSelection({
    items: filtered,
    getId: (log) => log.id,
  })

  const openAuditOverview = (log: AuditLog) => {
    const actionKey = resolveAuditActionKey(log.action)
    openPanel({
      title: log.action,
      subtitle: log.timestamp,
      icon: 'history',
      status: log.module,
      statusDotClass: auditActionDot[actionKey] ?? 'bg-outline',
      content: <AuditQuickContent log={log} />,
      widthClass: 'max-w-[520px]',
    })
  }

  if (logsQuery.isLoading) {
    return <PageLoadingSkeleton />
  }

  if (logsQuery.isError) {
    return (
      <ErrorState title="Could not load audit logs" onRetry={() => void logsQuery.refetch()} />
    )
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of significant administrative and security actions."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void logsQuery.refetch()}>
              Refresh
            </Button>
            <ExportButton
              resource={ResourceName.AUDIT}
              query={controls.debouncedSearch || undefined}
              filters={{
                action: controls.filters.action !== 'All Actions' ? controls.filters.action : undefined,
                module: controls.filters.module !== 'All Modules' ? controls.filters.module : undefined,
                dateFrom: controls.filters.dateFrom || undefined,
                dateTo: controls.filters.dateTo || undefined,
                timeFrom: controls.filters.timeFrom || undefined,
                timeTo: controls.filters.timeTo || undefined,
              }}
              selectedIds={selection.selectionMode ? Array.from(selection.selectedIds) : undefined}
              filenameStem="audit-logs"
            />
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="event_note" label="Loaded Events" value={String(auditLogs.length)} hint="From audit API / store." />
        <MetricCard
          icon="shield_person"
          label="Login-related"
          value={String(auditLogs.filter((l) => /login/i.test(l.action)).length)}
          hint="Successful login and logout style events."
        />
        <MetricCard
          icon="business_center"
          label="Business Events"
          value={String(auditLogs.filter((l) => !/login|lock/i.test(l.action)).length)}
          hint="Roles, users, settings changes."
        />
        <MetricCard
          icon="terminal"
          label="System Events"
          value={String(auditLogs.filter((l) => l.actor === 'System').length)}
          hint="Automated / system actor rows."
        />
      </section>

      <section className="bv-surface p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] grow-[2]">
            <label className="text-label-md text-on-surface" htmlFor="audit-search">
              Global Search
            </label>
            <div className="relative min-w-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                id="audit-search"
                value={controls.search}
                onChange={(e) => controls.setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-body-sm bg-transparent transition-colors"
                placeholder="Search description, employee, ID..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-label-md text-on-surface" htmlFor="audit-action">
              Action
            </label>
            <Select
              id="audit-action"
              value={controls.filters.action}
              onChange={(v) => controls.setFilter('action', v as AuditFilters['action'])}
              aria-label="Filter by action"
              options={ACTION_OPTIONS.map((a) => ({ value: a, label: a }))}
              minWidthClass="min-w-0 w-[8rem] max-w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-label-md text-on-surface" htmlFor="audit-module">
              Module
            </label>
            <Select
              id="audit-module"
              value={controls.filters.module}
              onChange={(v) => controls.setFilter('module', v as AuditFilters['module'])}
              aria-label="Filter by module"
              options={MODULE_OPTIONS.map((m) => ({ value: m, label: m }))}
              minWidthClass="min-w-0 w-[8rem] max-w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-label-md text-on-surface">Date</label>
            <DateRangeFilter
              value={{ from: controls.filters.dateFrom, to: controls.filters.dateTo }}
              onChange={({ from, to }) => {
                controls.setFilter('dateFrom', from)
                controls.setFilter('dateTo', to)
              }}
              label="Date"
              placeholder="Date"
            />
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-label-md text-on-surface">Time</label>
            <TimeRangeFilter
              value={{ from: controls.filters.timeFrom, to: controls.filters.timeTo }}
              onChange={({ from, to }) => {
                controls.setFilter('timeFrom', from)
                controls.setFilter('timeTo', to)
              }}
              label="Time"
              placeholder="Time"
            />
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-auto min-w-[5.5rem]"
              disabled={!controls.anyActive}
              onClick={controls.resetAll}
            >
              Clear
            </Button>
          </div>
        </div>
      </section>

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={filtered.length}
          onCancel={selection.exitSelectionMode}
        >
          <ExportButton
            resource={ResourceName.AUDIT}
            selectedIds={Array.from(selection.selectedIds)}
            filenameStem="audit-selected"
            label="Export selected"
          />
        </BulkSelectionBar>
      )}

      <section className="bv-surface overflow-hidden">
        <div ref={parentRef} className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead className="sticky top-0 z-10 bg-surface-container-low shadow-sm">
              <tr>
                <th className="px-3 py-3 w-12 text-center">
                  {selection.selectionMode ? (
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-secondary"
                      checked={selection.allFilteredSelected}
                      onChange={selection.toggleSelectAllFiltered}
                      aria-label="Select all filtered audit rows"
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Module</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paddingTop > 0 && (
                <tr>
                  <td colSpan={7} style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const log = filtered[virtualRow.index]
                const actionKey = resolveAuditActionKey(log.action)
                const id = log.id
                const selected = selection.isSelected(id)
                return (
                  <tr
                    key={log.id}
                    className={cn('cursor-pointer select-none', selected ? 'bg-secondary/10' : 'zebra-row')}
                    onMouseDown={() => selection.onRowPressStart(id)}
                    onMouseUp={() => selection.onRowPressEnd(id, () => openAuditOverview(log))}
                    onMouseLeave={selection.onRowPressCancel}
                    onTouchStart={() => selection.onRowPressStart(id)}
                    onTouchEnd={() => selection.onRowPressEnd(id, () => openAuditOverview(log))}
                    onTouchCancel={selection.onRowPressCancel}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <td
                      className="px-3 py-4 text-center"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (selection.selectionMode) selection.toggleOne(id)
                      }}
                    >
                      {selection.selectionMode ? (
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-secondary"
                          checked={selected}
                          onChange={() => selection.toggleOne(id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-outline-variant" aria-hidden />
                      )}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                          {log.actorInitials}
                        </div>
                        <span className="text-label-md text-on-background">{log.actor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={auditActionBadge[actionKey] ?? 'status-badge status-neutral'}>{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface max-w-[280px] truncate">{log.target}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{log.module}</td>
                    <td className="px-6 py-4 text-body-sm font-mono text-on-surface-variant">{log.ip}</td>
                  </tr>
                )
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td colSpan={7} style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant text-body-md">No audit events match your filters.</div>
        )}
        {filtered.length > 0 && !selection.selectionMode && (
          <div className="px-6 py-3 border-t border-outline-variant text-label-sm text-on-surface-variant">
            Showing {filtered.length} events · Hold a row 3s to multi-select · click row for overview
          </div>
        )}
      </section>
    </div>
  )
}
