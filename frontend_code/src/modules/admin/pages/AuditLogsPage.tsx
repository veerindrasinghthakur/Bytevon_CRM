import { useMemo, useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { IconButton } from '@/shared/components/ui/IconButton'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { ResourceName } from '@/shared/schema'
import { auditLogs } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const actionBadge: Record<string, string> = {
  Create: 'status-badge status-success',
  Update: 'status-badge status-info',
  Delete: 'status-badge status-error',
  Login: 'status-badge status-info',
  Lock: 'status-badge status-warning',
}

const actionDot: Record<string, string> = {
  Create: 'bg-emerald-500',
  Update: 'bg-blue-500',
  Delete: 'bg-red-500',
  Login: 'bg-sky-500',
  Lock: 'bg-amber-500',
}

type AuditLog = (typeof auditLogs)[number]

function AuditQuickContent({ log }: { log: AuditLog }) {
  return (
    <>
      <QuickSection title="Actor">
        <QuickPersonRow
          initials={log.actorInitials}
          roleLabel="Actor"
          name={log.actor}
        />
      </QuickSection>

      <QuickSection title="Event details">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="tag" label="Event ID" value={log.id} />
          <QuickMetaTile
            icon="bolt"
            label="Action"
            value={
              <span className={actionBadge[Object.keys(actionBadge).find((k) => log.action.toLowerCase().includes(k.toLowerCase())) ?? 'Update'] ?? 'status-badge status-neutral'}>
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
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All Actions')
  const [moduleFilter, setModuleFilter] = useState('All Modules')

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !log.action.toLowerCase().includes(q) &&
          !log.actor.toLowerCase().includes(q) &&
          !log.target.toLowerCase().includes(q) &&
          !log.module.toLowerCase().includes(q)
        )
          return false
      }
      if (actionFilter !== 'All Actions' && !log.action.toLowerCase().includes(actionFilter.toLowerCase()))
        return false
      if (moduleFilter !== 'All Modules' && log.module !== moduleFilter) return false
      return true
    })
  }, [search, actionFilter, moduleFilter])

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
    const actionKey =
      Object.keys(actionBadge).find((k) => log.action.toLowerCase().includes(k.toLowerCase())) ?? 'Update'
    openPanel({
      title: log.action,
      subtitle: log.timestamp,
      icon: 'history',
      status: log.module,
      statusDotClass: actionDot[actionKey] ?? 'bg-outline',
      content: <AuditQuickContent log={log} />,
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of significant administrative and security actions."
        actions={
          <div className="flex gap-2">
            <ExportButton
              resource={ResourceName.AUDIT}
              query={search.trim() || undefined}
              filters={{
                action: actionFilter !== 'All Actions' ? actionFilter : undefined,
                module: moduleFilter !== 'All Modules' ? moduleFilter : undefined,
              }}
              selectedIds={selection.selectionMode ? Array.from(selection.selectedIds) : undefined}
              filenameStem="audit-logs"
            />
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="event_note" value="1,284" title="Today's Activities" subtitle="Total audit events generated today." />
        <KpiCard icon="shield_person" value="342" title="Login Events" subtitle="Successful login and logout events." />
        <KpiCard icon="business_center" value="891" title="Business Events" subtitle="Projects, Leaves, and Approvals." />
        <KpiCard icon="terminal" value="51" title="System Events" subtitle="Background jobs and automation." />
      </section>

      <section className="bv-surface p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface" htmlFor="audit-search">
              Global Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                id="audit-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-body-sm bg-transparent transition-colors"
                placeholder="Search description, employee, ID..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface" htmlFor="audit-action">
              Action
            </label>
            <select
              id="audit-action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 bg-transparent transition-colors"
            >
              {['All Actions', 'Create', 'Update', 'Delete', 'Login', 'Lock'].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface" htmlFor="audit-module">
              Module
            </label>
            <select
              id="audit-module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 bg-transparent transition-colors"
            >
              {['All Modules', 'Roles', 'Auth', 'Settings', 'Users'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setActionFilter('All Actions')
                setModuleFilter('All Modules')
              }}
            >
              Clear Filters
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
          <table className="w-full text-left border-collapse min-w-[960px]">
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
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paddingTop > 0 && (
                <tr>
                  <td colSpan={8} style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const log = filtered[virtualRow.index]
                const actionKey =
                  Object.keys(actionBadge).find((k) => log.action.toLowerCase().includes(k.toLowerCase())) ??
                  'Update'
                const id = log.id
                const selected = selection.isSelected(id)
                return (
                  <tr
                    key={log.id}
                    className={cn(
                      'cursor-pointer select-none',
                      selected ? 'bg-secondary/10' : 'zebra-row',
                    )}
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
                      <span className={actionBadge[actionKey] ?? 'status-badge status-neutral'}>{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface max-w-[280px] truncate">
                      {log.target}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{log.module}</td>
                    <td className="px-6 py-4 text-body-sm font-mono text-on-surface-variant">{log.ip}</td>
                    <td
                      className="px-6 py-4 text-right"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton label={`View event ${log.id}`} size="sm" onClick={() => openAuditOverview(log)}>
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </IconButton>
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
        {filtered.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant text-body-md">No audit events match your filters.</div>
        )}
        {filtered.length > 0 && !selection.selectionMode && (
          <div className="px-6 py-3 border-t border-outline-variant text-label-sm text-on-surface-variant">
            Showing {filtered.length} events · Hold a row 3s to multi-select
          </div>
        )}
      </section>
    </div>
  )
}

function KpiCard({
  icon,
  value,
  title,
  subtitle,
}: {
  icon: string
  value: string
  title: string
  subtitle: string
}) {
  return (
    <div className="bv-surface card-hover p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-2xl font-bold text-primary">{value}</span>
      </div>
      <p className="text-title-lg font-semibold text-on-surface mb-1">{title}</p>
      <p className="text-label-sm text-on-surface-variant">{subtitle}</p>
    </div>
  )
}
