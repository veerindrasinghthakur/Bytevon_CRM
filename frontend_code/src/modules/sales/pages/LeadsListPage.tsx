import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
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
import { useLeadsList } from '../hooks/use-leads-list'
import { LeadMetricsRow } from '../components/LeadMetricsRow'
import { LeadFiltersBar } from '../components/LeadFiltersBar'
import type { PipelineStage, LeadPriority, RecordStatus, Lead } from '../types'
import { cn } from '@/shared/lib/cn'

const stageStyles: Record<PipelineStage, string> = {
  New: 'bg-slate-100 text-slate-700',
  Contacted: 'bg-blue-50 text-blue-700',
  Qualified: 'bg-blue-100 text-blue-800',
  Proposal: 'bg-orange-100 text-orange-700',
  Negotiation: 'bg-amber-100 text-amber-800',
  Won: 'bg-emerald-100 text-emerald-800',
  Lost: 'bg-red-50 text-red-700',
}

const priorityStyles: Record<LeadPriority, string> = {
  Critical: 'text-red-600',
  High: 'text-orange-600',
  Medium: 'text-amber-600',
  Low: 'text-slate-500',
}

const stageDot: Record<PipelineStage, string> = {
  New: 'bg-slate-400',
  Contacted: 'bg-blue-500',
  Qualified: 'bg-blue-600',
  Proposal: 'bg-orange-500',
  Negotiation: 'bg-amber-500',
  Won: 'bg-emerald-500',
  Lost: 'bg-red-500',
}

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
        status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
      )}
      title={status}
      aria-label={status}
    />
  )
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden="true">
      {name}
    </span>
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
          <QuickMetaTile
            icon="sell"
            label="Stage"
            value={
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', stageStyles[lead.stage])}>
                {lead.stage}
              </span>
            }
          />
          <QuickMetaTile
            icon="priority_high"
            label="Priority"
            value={<span className={cn('font-bold uppercase text-sm', priorityStyles[lead.priority])}>{lead.priority}</span>}
          />
        </div>
      </QuickSection>

      <QuickSection title="Assignment">
        <div className="space-y-3">
          {lead.assignedTo ? (
            <QuickPersonRow
              initials={lead.assignedTo
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
              roleLabel="Owner"
              name={lead.assignedTo}
            />
          ) : (
            <QuickRelatedRow icon="person_off" label="Owner" value="Unassigned" />
          )}
          {lead.contactTitle && (
            <QuickRelatedRow icon="badge" label="Title" value={lead.contactTitle} />
          )}
        </div>
      </QuickSection>

      <QuickSection title="Related">
        {lead.chatLink && (
          <QuickRelatedRow
            icon="chat"
            label="Chat"
            value={
              <a
                href={lead.chatLink}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-semibold hover:underline"
              >
                Open conversation
              </a>
            }
          />
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
    metrics,
    totalCount,
    filtered,
    isLoading,
    isError,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    priorityFilter,
    setPriorityFilter,
    sourceFilter,
    setSourceFilter,
    stages,
    priorities,
    resetFilters,
    selectionMode,
    selectedIds,
    allFilteredSelected,
    toggleOne,
    toggleSelectAllFiltered,
    exitSelectionMode,
    startLongPress,
    endLongPress,
    clearLongPress,
  } = useLeadsList()

  const openLeadOverview = (lead: Lead) => {
    openPanel({
      title: lead.contactName,
      subtitle: [lead.contactTitle, lead.id].filter(Boolean).join(' · '),
      icon: 'person_search',
      status: lead.stage,
      statusDotClass: stageDot[lead.stage] ?? 'bg-outline',
      content: <LeadQuickContent lead={lead} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => navigate({ to: '/sales/leads/$leadId', params: { leadId: lead.id } }),
      secondaryLabel: 'Log Task',
      onSecondary: () => {},
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-6 relative">
      <PageHeader
        title="Lead Management"
        description="Manage leads, assign ownership, qualify prospects and track progress through the sales pipeline."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" leftIcon={<Icon name="upload" className="text-lg" />}>
              Import
            </Button>
            <ExportButton
              resource={ResourceName.LEAD}
              query={search}
              filters={{
                status: statusFilter,
                stage: stageFilter,
                priority: priorityFilter,
                source: sourceFilter,
              }}
              selectedIds={selectionMode ? Array.from(selectedIds) : undefined}
              filenameStem="leads"
            />
            <Button
              variant="primary"
              leftIcon={<Icon name="add" className="text-lg" />}
              onClick={() => navigate({ to: '/sales/leads/new' })}
            >
              New Lead
            </Button>
          </div>
        }
      />

      <LeadMetricsRow metrics={metrics} />

      <LeadFiltersBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        stageFilter={stageFilter}
        onStageChange={setStageFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        stages={stages}
        priorities={priorities}
        onReset={resetFilters}
      />

      {selectionMode && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5">
          <span className="text-body-sm font-semibold text-on-surface">
            {selectedIds.size} selected
            <span className="text-on-surface-variant font-normal"> (of {filtered.length} shown)</span>
          </span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={exitSelectionMode}>
            Cancel
          </Button>
          <ExportButton
            resource={ResourceName.LEAD}
            selectedIds={Array.from(selectedIds)}
            filenameStem="leads-selected"
            label="Export selected"
          />
          <Button variant="primary" size="sm">
            Assign owner
          </Button>
        </div>
      )}

      {isLoading && <TableSkeleton rows={6} />}

      {isError && (
        <ErrorState
          title="Failed to load leads"
          description="We could not load the leads list. Check your connection and try again."
          onRetry={() => void refetch()}
          showBack={false}
        />
      )}

      {!isLoading && !isError && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="px-3 py-3 w-12 text-center">
                    {selectionMode ? (
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-secondary"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        title="Select all filtered rows"
                        aria-label="Select all filtered rows"
                      />
                    ) : (
                      <span className="sr-only">Status</span>
                    )}
                  </th>
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
                {filtered.map((lead) => {
                  const dateParts = formatDate(lead.date)
                  const isSelected = selectedIds.has(lead.id)
                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        'transition-colors cursor-pointer group select-none',
                        isSelected ? 'bg-secondary/10' : 'hover:bg-surface-container-low/50',
                      )}
                      onMouseDown={() => startLongPress(lead.id)}
                      onMouseUp={() => endLongPress(lead, openLeadOverview)}
                      onMouseLeave={clearLongPress}
                      onTouchStart={() => startLongPress(lead.id)}
                      onTouchEnd={() => endLongPress(lead, openLeadOverview)}
                      onTouchCancel={clearLongPress}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <td
                        className="px-3 py-4 text-center"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectionMode) toggleOne(lead.id)
                        }}
                      >
                        {selectionMode ? (
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-secondary"
                            checked={isSelected}
                            onChange={() => toggleOne(lead.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <StatusDotOnly status={lead.status} />
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{lead.id}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                            {lead.contactName
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface group-hover:text-secondary transition-colors">
                              {lead.contactName}
                            </p>
                            <p className="text-xs text-on-surface-variant">{lead.contactTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-[10px] font-bold">
                              {lead.assignedTo
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <span className="text-body-sm">{lead.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-body-sm italic text-on-surface-variant">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase', stageStyles[lead.stage])}>
                          {lead.stage}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('text-[11px] font-bold uppercase', priorityStyles[lead.priority])}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-on-surface">{formatBudget(lead.budget)}</p>
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.tags.map((t) => (
                              <span key={t} className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {dateParts ? (
                          <div className="flex flex-col items-center justify-center w-12 h-14 bg-surface-container rounded-lg border border-outline-variant/30">
                            <span className="text-lg font-black text-on-surface leading-none">{dateParts.day}</span>
                            <span className="text-[10px] font-bold text-secondary uppercase">{dateParts.month}</span>
                            <span className="text-[9px] text-on-surface-variant">{dateParts.year}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        className="px-4 py-4 text-center"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant"
                            onClick={() => openLeadOverview(lead)}
                            aria-label="Quick view"
                          >
                            <Icon name="visibility" className="text-sm" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant"
                            onClick={() =>
                              navigate({ to: '/sales/leads/$leadId/edit', params: { leadId: lead.id } })
                            }
                            aria-label="Edit lead"
                          >
                            <Icon name="edit" className="text-sm" />
                          </button>
                          {lead.chatLink && (
                            <a
                              href={lead.chatLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 hover:bg-surface-container rounded-md text-secondary"
                              title="Open chat"
                              aria-label="Open chat"
                            >
                              <Icon name="chat" className="text-sm" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">1–{filtered.length}</span> of{' '}
              <span className="font-semibold text-on-surface">{totalCount}</span> leads
              {!selectionMode && (
                <span className="ml-2 text-on-surface-variant/80">· Hold a row 3s to multi-select</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
