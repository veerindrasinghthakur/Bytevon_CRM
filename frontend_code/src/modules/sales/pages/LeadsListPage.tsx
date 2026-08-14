import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leads, salesMetrics, clients } from '../data/mock'
import type { Lead, PipelineStage, LeadPriority, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const LONG_PRESS_MS = 3000

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

function clientValue(c: (typeof clients)[0]) {
  return c.arr ?? c.revenue ?? 0
}

export function LeadsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [stageFilter, setStageFilter] = useState<string>('All')
  const [priorityFilter, setPriorityFilter] = useState<string>('All')
  const [sourceFilter, setSourceFilter] = useState<string>('All')
  const [quickView, setQuickView] = useState<Lead | null>(null)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const topClients = useMemo(() => {
    return [...clients]
      .filter((c) => c.status === 'Active')
      .sort((a, b) => clientValue(b) - clientValue(a))
      .slice(0, 4)
  }, [])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        l.contactName.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || l.status === statusFilter
      const matchStage = stageFilter === 'All' || l.stage === stageFilter
      const matchPriority = priorityFilter === 'All' || l.priority === priorityFilter
      const matchSource = sourceFilter === 'All' || l.source === sourceFilter
      return matchSearch && matchStatus && matchStage && matchPriority && matchSource
    })
  }, [search, statusFilter, stageFilter, priorityFilter, sourceFilter])

  useEffect(() => {
    const visible = new Set(filtered.map((l) => l.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)))
      if (next.size === 0 && selectionMode) setSelectionMode(false)
      return next
    })
  }, [filtered, selectionMode])

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const enterSelectionWith = useCallback((id: string) => {
    setSelectionMode(true)
    setSelectedIds(new Set([id]))
  }, [])

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectionMode(false)
      else setSelectionMode(true)
      return next
    })
  }, [])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
      setSelectionMode(false)
    } else {
      setSelectedIds(new Set(filtered.map((l) => l.id)))
      setSelectionMode(true)
    }
  }

  const exitSelectionMode = () => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  const startLongPress = (id: string) => {
    longPressTriggered.current = false
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      enterSelectionWith(id)
    }, LONG_PRESS_MS)
  }

  const endLongPress = (lead: Lead) => {
    clearLongPress()
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    if (selectionMode) toggleOne(lead.id)
    else setQuickView(lead)
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setStageFilter('All')
    setPriorityFilter('All')
    setSourceFilter('All')
  }

  return (
    <div className="space-y-6 relative">
      <PageHeader
        title="Lead Management"
        description="Manage leads, assign ownership, qualify prospects and track progress through the sales pipeline."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" leftIcon={<span className="material-symbols-outlined text-lg">upload</span>}>
              Import
            </Button>
            <Button variant="outline" leftIcon={<span className="material-symbols-outlined text-lg">download</span>}>
              Export
            </Button>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
              onClick={() => navigate({ to: '/sales/leads/new' })}
            >
              New Lead
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {salesMetrics.map((m) => (
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
                <span className="material-symbols-outlined text-xl">{m.icon}</span>
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

      {/* Top Clients */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-title-md font-bold text-on-background">Top Clients</h3>
            <p className="text-label-sm text-on-surface-variant">
              Highest-value active accounts linked to the pipeline
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/sales/clients' })}>
            View all clients
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {topClients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() =>
                navigate({ to: '/sales/clients/$clientId', params: { clientId: client.id } })
              }
              className="text-left p-4 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm hover:shadow-md hover:border-secondary/40 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-sm font-bold shrink-0">
                  {client.logoInitials ?? client.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusDotOnly status={client.status} />
                    <p className="font-semibold text-on-surface truncate group-hover:text-secondary transition-colors">
                      {client.name}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                    {client.industry}
                    {client.country ? ` · ${client.country}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">ARR / Revenue</p>
                  <p className="text-lg font-bold text-on-background">
                    {clientValue(client) > 0 ? formatBudget(clientValue(client)) : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Open leads</p>
                  <p className="text-body-md font-semibold text-secondary">{client.leads}</p>
                </div>
              </div>
              {client.growth && (
                <p className="mt-2 text-[11px] font-semibold text-emerald-700">{client.growth} growth</p>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            placeholder="Search by name, company, or ID..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-label-sm outline-none"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-label-sm outline-none"
        >
          <option value="All">All Stages</option>
          {(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as PipelineStage[]).map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-label-sm outline-none"
        >
          <option value="All">All Priority</option>
          {(['Critical', 'High', 'Medium', 'Low'] as LeadPriority[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-label-sm outline-none"
        >
          <option value="All">All Sources</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Referral">Referral</option>
          <option value="Website">Website</option>
          <option value="Direct Referral">Direct Referral</option>
        </select>
        <button
          type="button"
          className="p-2 text-secondary border border-outline-variant rounded-lg hover:bg-secondary/5"
          onClick={resetFilters}
          aria-label="Reset filters"
        >
          <span className="material-symbols-outlined text-lg">restart_alt</span>
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
          <Button variant="outline" size="sm">
            Export selected
          </Button>
          <Button variant="primary" size="sm">
            Assign owner
          </Button>
        </div>
      )}

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
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Client</th>
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
                      <p className="font-semibold text-on-surface">{lead.company}</p>
                      <p className="text-xs text-on-surface-variant">{lead.industry}</p>
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
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant"
                          onClick={() =>
                            navigate({ to: '/sales/leads/$leadId/edit', params: { leadId: lead.id } })
                          }
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {lead.chatLink && (
                          <a
                            href={lead.chatLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-surface-container rounded-md text-secondary"
                            title="Open chat"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
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
            <span className="font-semibold text-on-surface">{leads.length}</span> leads
            {!selectionMode && (
              <span className="ml-2 text-on-surface-variant/80">· Hold a row 3s to multi-select</span>
            )}
          </p>
        </div>
      </div>

      {quickView && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setQuickView(null)} aria-hidden />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-lowest shadow-2xl border-l border-outline-variant z-50 flex flex-col">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <h4 className="text-title-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">info</span>
                Lead Quick View
              </h4>
              <button type="button" className="p-2 hover:bg-surface-container rounded-full" onClick={() => setQuickView(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-xl font-bold">
                  {quickView.contactName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <StatusDotOnly status={quickView.status} />
                    <h5 className="text-xl font-bold text-on-surface">{quickView.contactName}</h5>
                  </div>
                  <p className="text-on-surface-variant text-sm">
                    {quickView.contactTitle} at{' '}
                    <span className="font-semibold text-secondary">{quickView.company}</span>
                  </p>
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
                    <span className="material-symbols-outlined text-lg">chat</span>
                    Open conversation with {quickView.contactName}
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
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
            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex gap-3">
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
