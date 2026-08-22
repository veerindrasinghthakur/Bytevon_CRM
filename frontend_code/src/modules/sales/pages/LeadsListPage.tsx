import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { HEADER_HEIGHT_PX } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { ResourceName } from '@/shared/schema'
import { useLeadsList } from '../hooks/use-leads-list'
import type { PipelineStage, LeadPriority, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const QUICK_VIEW_BOTTOM_GAP_PX = 12

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

function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
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
        status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
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

export function LeadsListPage() {
  const navigate = useNavigate()
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
    quickView,
    setQuickView,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <div
            key={m.id}
            className={cn(
              'p-5 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow',
              m.id === 'pipeline'
                ? 'bg-primary-container text-white border-primary-container'
                : 'bg-surface-container-lowest'
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={cn(
                  'p-2 rounded-lg',
                  m.id === 'pipeline' ? 'bg-white/10 text-white' : 'bg-secondary/10 text-secondary'
                )}
              >
                <Icon name={m.icon} className="text-xl" />
              </span>
              {m.change && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    m.id === 'pipeline'
                      ? 'bg-white/10 text-white/80'
                      : m.changeType === 'positive'
                        ? 'text-emerald-700 bg-emerald-50'
                        : m.changeType === 'negative'
                          ? 'text-red-700 bg-red-50'
                          : 'text-on-surface-variant bg-surface-container'
                  )}
                >
                  {m.change}
                </span>
              )}
            </div>
            <p className={cn('text-label-md', m.id === 'pipeline' ? 'text-white/70' : 'text-on-surface-variant')}>
              {m.label}
            </p>
            <h3 className={cn('text-headline-md font-bold mt-0.5', m.id === 'pipeline' ? 'text-white' : 'text-on-background')}>
              {m.value}
            </h3>
            {m.subtitle && (
              <p className={cn('text-[11px] mt-1', m.id === 'pipeline' ? 'text-white/50' : 'text-on-surface-variant')}>
                {m.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            placeholder="Search by name or ID..."
          />
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            { value: 'All', label: 'All Status' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
          minWidthClass="min-w-[130px]"
        />
        <Select
          value={stageFilter}
          onChange={setStageFilter}
          placeholder="All Stages"
          options={[
            { value: 'All', label: 'All Stages' },
            ...stages.map((s) => ({ value: s, label: s })),
          ]}
          minWidthClass="min-w-[140px]"
        />
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          placeholder="All Priority"
          options={[
            { value: 'All', label: 'All Priority' },
            ...priorities.map((p) => ({ value: p, label: p })),
          ]}
          minWidthClass="min-w-[130px]"
        />
        <Select
          value={sourceFilter}
          onChange={setSourceFilter}
          placeholder="All Sources"
          options={[
            { value: 'All', label: 'All Sources' },
            { value: 'LinkedIn', label: 'LinkedIn' },
            { value: 'Referral', label: 'Referral' },
            { value: 'Website', label: 'Website' },
            { value: 'Direct Referral', label: 'Direct Referral' },
          ]}
          minWidthClass="min-w-[140px]"
        />
        <button
          type="button"
          className="p-2 text-secondary border border-outline-variant rounded-lg hover:bg-secondary/5"
          onClick={resetFilters}
          aria-label="Reset filters"
        >
          <Icon name="restart_alt" className="text-lg" />
        </button>
      </div>

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
                        isSelected ? 'bg-secondary/10' : 'hover:bg-surface-container-low/50'
                      )}
                      onMouseDown={() => startLongPress(lead.id)}
                      onMouseUp={() => endLongPress(lead)}
                      onMouseLeave={clearLongPress}
                      onTouchStart={() => startLongPress(lead.id)}
                      onTouchEnd={() => endLongPress(lead)}
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
                      <td className="px-4 py-4 text-center" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant"
                            onClick={() => setQuickView(lead)}
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

      {quickView && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setQuickView(null)}
            aria-hidden
          />
          <div
            className="fixed right-0 z-50 w-full max-w-md bg-surface-container-lowest shadow-2xl border border-outline-variant rounded-l-xl flex flex-col overflow-hidden"
            style={{
              top: HEADER_HEIGHT_PX + QUICK_VIEW_BOTTOM_GAP_PX,
              bottom: QUICK_VIEW_BOTTOM_GAP_PX,
              height: `calc(100vh - ${HEADER_HEIGHT_PX + QUICK_VIEW_BOTTOM_GAP_PX * 2}px)`,
            }}
            role="dialog"
            aria-label="Lead quick view"
          >
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
              <h4 className="text-title-lg font-bold flex items-center gap-2">
                <Icon name="info" className="text-secondary" />
                Lead Quick View
              </h4>
              <button
                type="button"
                className="p-2 hover:bg-surface-container rounded-full"
                onClick={() => setQuickView(null)}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-xl font-bold shrink-0">
                  {quickView.contactName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDotOnly status={quickView.status} />
                    <h5 className="text-xl font-bold text-on-surface truncate">{quickView.contactName}</h5>
                  </div>
                  {quickView.contactTitle && (
                    <p className="text-on-surface-variant text-sm">{quickView.contactTitle}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', stageStyles[quickView.stage])}>
                      {quickView.stage}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Estimated Value</p>
                  <p className="text-lg font-bold">{formatBudget(quickView.budget)}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Stage</p>
                  <p className="text-lg font-bold text-secondary">{quickView.stage}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Source</p>
                  <p className="text-lg font-semibold">{quickView.source}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Date</p>
                  <p className="text-lg font-semibold">{quickView.date ?? '—'}</p>
                </div>
              </div>

              {quickView.chatLink && (
                <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">Client Chat</p>
                  <a
                    href={quickView.chatLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-secondary font-semibold text-sm hover:underline"
                  >
                    <Icon name="chat" className="text-lg" />
                    Open conversation with {quickView.contactName}
                    <Icon name="open_in_new" className="text-sm" />
                  </a>
                </div>
              )}

              {quickView.notes && (
                <div className="p-4 bg-surface-container rounded-xl">
                  <h6 className="text-xs font-bold uppercase text-on-surface-variant mb-2">Internal Notes</h6>
                  <p className="text-body-sm text-on-surface italic">"{quickView.notes}"</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex gap-3 shrink-0">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setQuickView(null)
                  navigate({ to: '/sales/leads/$leadId', params: { leadId: quickView.id } })
                }}
              >
                Open Full Record
              </Button>
              <Button variant="outline">Log Task</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
