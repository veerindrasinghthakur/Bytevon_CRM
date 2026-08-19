import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { clients, clientMetrics } from '../data/mock'
import type { Client, ClientType, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const LONG_PRESS_MS = 3000

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

const typeStyles: Record<ClientType, string> = {
  Enterprise: 'bg-violet-100 text-violet-800',
  SMB: 'bg-sky-100 text-sky-800',
  Partner: 'bg-amber-100 text-amber-800',
}

function formatMoney(n?: number) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function ClientsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [quickView, setQuickView] = useState<Client | null>(null)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        (c.primaryContact?.toLowerCase().includes(q) ?? false) ||
        c.id.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || c.status === statusFilter
      const matchType = typeFilter === 'All' || c.type === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    const visible = new Set(filtered.map((c) => c.id))
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
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
      setSelectionMode(false)
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
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

  const endLongPress = (client: Client) => {
    clearLongPress()
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    if (selectionMode) toggleOne(client.id)
    else setQuickView(client)
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setTypeFilter('All')
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Client Management"
        description="Manage client accounts, contacts, and commercial relationships."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" leftIcon={<span className="material-symbols-outlined text-lg">download</span>}>
              Export
            </Button>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
              onClick={() => navigate({ to: '/sales/clients/new' })}
            >
              New Client
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clientMetrics.map((m) => (
          <div key={m.id} className="bv-surface card-hover p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-xl">{m.icon}</span>
              </span>
              {m.change && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    m.changeType === 'positive'
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
            <p className="text-label-md text-on-surface-variant">{m.label}</p>
            <h3 className="text-headline-md font-bold mt-0.5 text-on-background">{m.value}</h3>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
            placeholder="Search by name, industry, or contact..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-label-sm outline-none focus:border-secondary transition-colors"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-label-sm outline-none focus:border-secondary transition-colors"
        >
          <option value="All">All Types</option>
          <option value="Enterprise">Enterprise</option>
          <option value="SMB">SMB</option>
          <option value="Partner">Partner</option>
        </select>
        <button
          type="button"
          className="p-2 text-secondary border border-outline-variant rounded-lg hover:bg-secondary/5 transition-colors"
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
            Archive
          </Button>
        </div>
      )}

      <div className="bv-surface overflow-hidden">
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
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  ARR / Revenue
                </th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((client) => {
                const isSelected = selectedIds.has(client.id)
                return (
                  <tr
                    key={client.id}
                    className={cn(
                      'cursor-pointer group select-none',
                      isSelected ? 'bg-secondary/10' : 'zebra-row'
                    )}
                    onMouseDown={() => startLongPress(client.id)}
                    onMouseUp={() => endLongPress(client)}
                    onMouseLeave={clearLongPress}
                    onTouchStart={() => startLongPress(client.id)}
                    onTouchEnd={() => endLongPress(client)}
                    onTouchCancel={clearLongPress}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <td
                      className="px-3 py-4 text-center"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (selectionMode) toggleOne(client.id)
                      }}
                    >
                      {selectionMode ? (
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-secondary"
                          checked={isSelected}
                          onChange={() => toggleOne(client.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <StatusDotOnly status={client.status} />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                          {client.logoInitials ?? client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface group-hover:text-secondary transition-colors">
                            {client.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">{client.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          typeStyles[client.type]
                        )}
                      >
                        {client.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-body-sm text-on-surface">{client.industry}</td>
                    <td className="px-4 py-4 font-semibold text-on-surface">{client.projects}</td>
                    <td className="px-4 py-4 font-semibold text-on-surface">{client.leads}</td>
                    <td className="px-4 py-4 font-semibold text-on-surface">
                      {formatMoney(client.arr ?? client.revenue)}
                    </td>
                    <td
                      className="px-4 py-4 text-center"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant transition-colors"
                          onClick={() => setQuickView(client)}
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                        {client.chatLink && (
                          <a
                            href={client.chatLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-surface-container rounded-md text-secondary transition-colors"
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
        <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant">
          <p className="text-xs text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">1–{filtered.length}</span> of{' '}
            <span className="font-semibold text-on-surface">{clients.length}</span> clients
            {!selectionMode && (
              <span className="ml-2 text-on-surface-variant/80">· Hold a row 3s to multi-select</span>
            )}
          </p>
        </div>
      </div>

      {quickView && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setQuickView(null)}
            aria-hidden
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-lowest shadow-drawer border-l border-outline-variant z-50 flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <h4 className="text-title-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">handshake</span>
                Client Quick View
              </h4>
              <button
                type="button"
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
                onClick={() => setQuickView(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-xl font-bold">
                  {quickView.logoInitials ?? quickView.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <StatusDotOnly status={quickView.status} />
                    <h5 className="text-xl font-bold text-on-surface">{quickView.name}</h5>
                  </div>
                  <p className="text-on-surface-variant text-sm">{quickView.industry}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        typeStyles[quickView.type]
                      )}
                    >
                      {quickView.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Projects</p>
                  <p className="text-lg font-bold">{quickView.projects}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Leads</p>
                  <p className="text-lg font-bold">{quickView.leads}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">ARR / Revenue</p>
                  <p className="text-lg font-bold">{formatMoney(quickView.arr ?? quickView.revenue)}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Country</p>
                  <p className="text-lg font-semibold">{quickView.country}</p>
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
                    Open conversation
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-outline-variant bg-surface-container-low">
              <Button variant="primary" className="w-full" onClick={() => setQuickView(null)}>
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
