import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { StatusDot } from '@/shared/components/ui/StatusDot'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { ResourceName } from '@/shared/schema'
import { useClientsList } from '../hooks/use-clients-list'
import type { ClientType, Client } from '../types'
import { cn } from '@/shared/lib/cn'

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

function ClientQuickContent({ client }: { client: Client }) {
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-xl font-bold shrink-0">
          {client.logoInitials ?? client.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot status={client.status} />
            <h5 className="text-xl font-bold text-on-surface truncate">{client.name}</h5>
          </div>
          <p className="text-on-surface-variant text-sm">{client.industry}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', typeStyles[client.type])}>
              {client.type}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-surface-container-low rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Projects</p>
          <p className="text-lg font-bold">{client.projects}</p>
        </div>
        <div className="p-4 bg-surface-container-low rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Leads</p>
          <p className="text-lg font-bold">{client.leads}</p>
        </div>
        <div className="p-4 bg-surface-container-low rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">ARR / Revenue</p>
          <p className="text-lg font-bold">{formatMoney(client.arr ?? client.revenue)}</p>
        </div>
        <div className="p-4 bg-surface-container-low rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Country</p>
          <p className="text-lg font-semibold">{client.country}</p>
        </div>
      </div>

      {client.chatLink && (
        <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">Client Chat</p>
          <a
            href={client.chatLink}
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
    </>
  )
}

export function ClientsListPage() {
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
    typeFilter,
    setTypeFilter,
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
  } = useClientsList()

  const openFull = (clientId: string) => {
    navigate({ to: '/sales/clients/$clientId', params: { clientId } })
  }

  const openClientOverview = (client: Client) => {
    openPanel({
      title: 'Client Quick View',
      content: <ClientQuickContent client={client} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => openFull(client.id),
      widthClass: 'max-w-md',
    })
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Client Management"
        description="Manage client accounts, contacts, and commercial relationships."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <ExportButton
              resource={ResourceName.CLIENT}
              query={search}
              filters={{ status: statusFilter, type: typeFilter }}
              selectedIds={selectionMode ? Array.from(selectedIds) : undefined}
              filenameStem="clients"
            />
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
        {metrics.map((m) => (
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
                        : 'text-on-surface-variant bg-surface-container',
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
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            { value: 'All', label: 'All Status' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
          minWidthClass="min-w-[140px]"
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All Types"
          options={[
            { value: 'All', label: 'All Types' },
            { value: 'Enterprise', label: 'Enterprise' },
            { value: 'SMB', label: 'SMB' },
            { value: 'Partner', label: 'Partner' },
          ]}
          minWidthClass="min-w-[140px]"
        />
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
          <ExportButton
            resource={ResourceName.CLIENT}
            selectedIds={Array.from(selectedIds)}
            filenameStem="clients-selected"
            label="Export selected"
          />
          <Button variant="primary" size="sm">
            Archive
          </Button>
        </div>
      )}

      {isLoading && <TableSkeleton rows={6} />}

      {isError && (
        <ErrorState
          title="Failed to load clients"
          description="We could not load the clients list. Check your connection and try again."
          onRetry={() => void refetch()}
          showBack={false}
        />
      )}

      {!isLoading && !isError && (
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
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Industry</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Projects</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Leads</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">ARR / Revenue</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">Actions</th>
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
                        isSelected ? 'bg-secondary/10' : 'zebra-row',
                      )}
                      onMouseDown={() => startLongPress(client.id)}
                      onMouseUp={() => endLongPress(client, openClientOverview)}
                      onMouseLeave={clearLongPress}
                      onTouchStart={() => startLongPress(client.id)}
                      onTouchEnd={() => endLongPress(client, openClientOverview)}
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
                          <StatusDot status={client.status} />
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
                        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase', typeStyles[client.type])}>
                          {client.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-body-sm text-on-surface">{client.industry}</td>
                      <td className="px-4 py-4 font-semibold text-on-surface">{client.projects}</td>
                      <td className="px-4 py-4 font-semibold text-on-surface">{client.leads}</td>
                      <td className="px-4 py-4 font-semibold text-on-surface">{formatMoney(client.arr ?? client.revenue)}</td>
                      <td
                        className="px-4 py-4 text-center"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant transition-colors"
                            onClick={() => openClientOverview(client)}
                            aria-label="Quick view"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button
                            type="button"
                            className="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant transition-colors"
                            onClick={() => openFull(client.id)}
                            aria-label="Open full record"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
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
              <span className="font-semibold text-on-surface">{totalCount}</span> clients
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
