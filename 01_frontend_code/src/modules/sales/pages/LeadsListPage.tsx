import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Pagination } from '@/shared/components/ui/Pagination'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { RowActions } from '@/shared/components/ui/RowActions'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { ResourceName } from '@/shared/schema'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useLeadsList } from '../hooks/use-leads-list'
import { LeadMetricsRow } from '../components/LeadMetricsRow'
import { salesRoutes } from '../routes'
import type { RecordStatus, Lead } from '../types'
import { cn } from '@/shared/lib/cn'
import { stageStyles, priorityStyles, stageDot } from '../schemas/enums'

function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    year: String(d.getFullYear()),
  }
}

function StatusDotOnly({ status }: { status: RecordStatus }) {
  return (
    <span
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full shrink-0',
        status === 'Active' ? 'bg-secondary' : 'bg-outline',
      )}
      title={status}
      aria-label={status}
    />
  )
}

function LeadQuickContent({ lead }: { lead: Lead }) {
  return (
    <>
      <QuickSection title="Pipeline">
        <QuickStatGrid>
          <QuickStat icon="payments" value={formatBudget(lead.budget)} label="Value" />
          <QuickStat icon="flag" value={lead.stage} label="Stage" />
          <QuickStat icon="priority_high" value={lead.priority} label="Priority" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="source" label="Source" value={lead.source} />
          <QuickMetaTile icon="event" label="Date" value={lead.date ?? '—'} />
          <QuickMetaTile icon="sell" label="Stage" value={<span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', stageStyles[lead.stage])}>{lead.stage}</span>} />
          <QuickMetaTile icon="priority_high" label="Priority" value={<span className={cn('font-bold uppercase text-sm', priorityStyles[lead.priority])}>{lead.priority}</span>} />
        </div>
      </QuickSection>
      <QuickSection title="Assignment">
        <div className="space-y-3">
          {lead.assignedTo ? (
            <QuickPersonRow initials={lead.assignedTo.split(' ').map((p) => p[0]).join('').slice(0, 2)} roleLabel="Owner" name={lead.assignedTo} />
          ) : (
            <QuickRelatedRow icon="person_off" label="Owner" value="Unassigned" />
          )}
          {lead.contactTitle && <QuickRelatedRow icon="badge" label="Title" value={lead.contactTitle} />}
        </div>
      </QuickSection>
      <QuickSection title="Related">
        {lead.chatLink && (
          <QuickRelatedRow icon="chat" label="Chat" value={<a href={lead.chatLink} target="_blank" rel="noreferrer" className="text-secondary font-semibold hover:underline">Open conversation</a>} />
        )}
        {lead.notes && <QuickRelatedRow icon="notes" label="Notes" value={lead.notes} />}
        {lead.tags && lead.tags.length > 0 && (
          <QuickRelatedRow icon="label" label="Tags" value={lead.tags.join(', ')} />
        )}
      </QuickSection>
    </>
  )
}

export function LeadsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    metrics, totalCount, filtered, isLoading, isError, isFetching, refetch,
    search, setSearch, statusFilter, setStatusFilter, stageFilter, setStageFilter,
    priorityFilter, setPriorityFilter, sourceFilter, setSourceFilter,
    stages, priorities, sources, resetFilters, page, setPage, pageSize,
    selectionMode, selectedIds, allFilteredSelected, toggleOne, toggleSelectAllFiltered,
    exitSelectionMode, startLongPress, endLongPress, clearLongPress,
  } = useLeadsList()

  const filtersActive = Boolean(search.trim()) || statusFilter !== 'All' || stageFilter !== 'All' || priorityFilter !== 'All' || sourceFilter !== 'All'
  const parentRef = useRef<HTMLDivElement>(null)
  const goDetail = (leadId: string) => safeNavigate(navigate, { to: salesRoutes.leadDetail(leadId), params: { leadId } })
  const goEdit = (leadId: string) => safeNavigate(navigate, { to: salesRoutes.leadEdit(leadId), params: { leadId } })
  const goNew = () => safeNavigate(navigate, { to: salesRoutes.leadNew })
  const rowVirtualizer = useVirtualizer({ count: filtered.length, getScrollElement: () => parentRef.current, estimateSize: () => 72, overscan: 5 })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0
  const openLeadOverview = (lead: Lead) => {
    openPanel({
      title: lead.contactName,
      subtitle: [lead.contactTitle, lead.id].filter(Boolean).join(' · '),
      icon: 'person_search',
      status: lead.stage,
      statusDotClass: stageDot[lead.stage] ?? 'bg-outline',
      content: <LeadQuickContent lead={lead} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goDetail(lead.id),
      onEdit: () => goEdit(lead.id),
      editLabel: 'Edit lead',
      widthClass: 'max-w-[520px]',
    })
  }
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader title="Lead Management" description="Manage leads, assign ownership, qualify prospects and track progress through the sales pipeline." actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">upload</span>}>Import</Button>
          <ExportButton resource={ResourceName.LEAD} query={search} filters={{ status: statusFilter, stage: stageFilter, priority: priorityFilter, source: sourceFilter }} selectedIds={selectionMode ? Array.from(selectedIds) : undefined} filenameStem="leads" />
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>} onClick={goNew}>New Lead</Button>
        </div>
      } />
      <LeadMetricsRow metrics={metrics} />
      <ListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name or ID..." filtersActive={filtersActive} onResetFilters={resetFilters} onRefresh={() => void refetch()}>
        <Select value={statusFilter} onChange={setStatusFilter} placeholder="All Status" aria-label="Filter by status" options={[{ value: 'All', label: 'All Status' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} minWidthClass="min-w-[130px]" />
        <Select value={stageFilter} onChange={setStageFilter} placeholder="All Stages" aria-label="Filter by stage" options={[{ value: 'All', label: 'All Stages' }, ...stages.map((s) => ({ value: s, label: s }))]} minWidthClass="min-w-[140px]" />
        <Select value={priorityFilter} onChange={setPriorityFilter} placeholder="All Priority" aria-label="Filter by priority" options={[{ value: 'All', label: 'All Priority' }, ...priorities.map((p) => ({ value: p, label: p }))]} minWidthClass="min-w-[130px]" />
        <Select value={sourceFilter} onChange={setSourceFilter} placeholder="All Sources" aria-label="Filter by source" options={[{ value: 'All', label: 'All Sources' }, ...sources.map((s) => ({ value: s, label: s }))]} minWidthClass="min-w-[140px]" />
      </ListToolbar>
      {selectionMode && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5 executive-shadow">
          <span className="text-body-sm font-semibold text-on-surface">{selectedIds.size} selected<span className="text-on-surface-variant font-normal"> (of {filtered.length} on this page)</span></span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={exitSelectionMode}>Cancel</Button>
          <ExportButton resource={ResourceName.LEAD} selectedIds={Array.from(selectedIds)} filenameStem="leads-selected" label="Export selected" />
          <Button variant="primary" size="sm">Assign owner</Button>
        </div>
      )}
      {isError && (
        <ErrorState title="Failed to load leads" description="We could not load the leads list. Check your connection and try again." onRetry={() => void refetch()} onBack={() => safeNavigate(navigate, { to: salesRoutes.leads })} />
      )}
      {!isError && (
        <div className="bv-surface overflow-hidden relative">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]"><TableSkeleton rows={6} /></div>
          )}
          <div ref={parentRef} className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container-low/90 backdrop-blur-[2px]">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">{selectionMode ? (<input type="checkbox" className="rounded border-outline-variant text-secondary" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} title="Select all on this page" aria-label="Select all on this page" />) : (<span className="sr-only">Status</span>)}</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Lead Name</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Quotation</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {paddingTop > 0 && (<tr><td colSpan={9} style={{ height: `${paddingTop}px` }} /></tr>)}
                {virtualRows.map((virtualRow) => {
                  const lead = filtered[virtualRow.index]
                  const dateParts = formatDate(lead.date)
                  const isSelected = selectedIds.has(lead.id)
                  return (
                    <tr key={lead.id} className={cn('cursor-pointer group select-none', isSelected ? 'bg-secondary/10' : 'zebra-row')} onMouseDown={() => startLongPress(lead.id)} onMouseUp={() => endLongPress(lead, openLeadOverview)} onMouseLeave={clearLongPress} onTouchStart={() => startLongPress(lead.id)} onTouchEnd={() => endLongPress(lead, openLeadOverview)} onTouchCancel={clearLongPress} onContextMenu={(e) => e.preventDefault()}>
                      <td className="px-3 py-4 text-center" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (selectionMode) toggleOne(lead.id) }}>
                        {selectionMode ? (<input type="checkbox" className="rounded border-outline-variant text-secondary" checked={isSelected} onChange={() => toggleOne(lead.id)} onClick={(e) => e.stopPropagation()} />) : (<StatusDotOnly status={lead.status} />)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{lead.id}</td>
                      <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">{lead.contactName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div><div><p className="font-semibold text-on-surface group-hover:text-secondary transition-colors">{lead.contactName}</p><p className="text-xs text-on-surface-variant">{lead.contactTitle}</p></div></div></td>
                      <td className="px-4 py-4">{lead.assignedTo ? (<div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-[10px] font-bold">{lead.assignedTo.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div><span className="text-body-sm">{lead.assignedTo}</span></div>) : (<span className="text-body-sm italic text-on-surface-variant">Unassigned</span>)}</td>
                      <td className="px-4 py-4"><span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase', stageStyles[lead.stage])}>{lead.stage}</span></td>
                      <td className="px-4 py-4"><span className={cn('text-[11px] font-bold uppercase', priorityStyles[lead.priority])}>{lead.priority}</span></td>
                      <td className="px-4 py-4"><p className="font-bold text-on-surface">{formatBudget(lead.budget)}</p></td>
                      <td className="px-4 py-4">{dateParts ? (<div className="flex flex-col items-center justify-center w-12 h-14 bg-surface-container rounded-lg border border-outline-variant/30"><span className="text-[10px] font-bold text-secondary leading-none">{dateParts.day}</span><span className="text-[9px] font-semibold text-on-surface-variant">{dateParts.month}</span><span className="text-[9px] text-on-surface-variant">{dateParts.year}</span></div>) : (<span className="text-on-surface-variant">—</span>)}</td>
                      <td className="px-4 py-4 text-center" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center"><RowActions label={`Actions for ${lead.contactName}`} actions={[{ id: 'overview', label: 'Quick view', icon: 'visibility', onClick: () => openLeadOverview(lead) }, { id: 'details', label: 'View details', icon: 'description', onClick: () => goDetail(lead.id) }, { id: 'edit', label: 'Edit', icon: 'edit', onClick: () => goEdit(lead.id) }]} /></div>
                      </td>
                    </tr>
                  )
                })}
                {paddingBottom > 0 && (<tr><td colSpan={9} style={{ height: `${paddingBottom}px` }} /></tr>)}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-surface-container-low/30 border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant">Showing <span className="font-semibold text-on-surface">{rangeFrom}–{rangeTo}</span> of <span className="font-semibold text-on-surface">{totalCount}</span> leads{!selectionMode && (<span className="ml-2 text-on-surface-variant/80">· Hold a row 3s to multi-select</span>)}</p>
          </div>
          <Pagination page={page} pageSize={pageSize} total={totalCount} onPageChange={setPage} itemLabel="leads" />
        </div>
      )}
    </div>
  )
}
