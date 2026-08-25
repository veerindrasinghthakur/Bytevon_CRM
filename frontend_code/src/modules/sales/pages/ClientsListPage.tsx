import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Pagination } from '@/shared/components/ui/Pagination'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { StatusDot } from '@/shared/components/ui/StatusDot'
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
} from '@/shared/components/layout/QuickOverviewParts'
import { ResourceName } from '@/shared/schema'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useClientsList } from '../hooks/use-clients-list'
import { salesRoutes } from '../routes'
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
      <QuickSection title="Quick Statistics">
        <QuickStatGrid>
          <QuickStat icon="folder_open" value={client.projects} label="Projects" />
          <QuickStat icon="person_search" value={client.leads} label="Leads" />
          <QuickStat icon="payments" value={formatMoney(client.arr ?? client.revenue)} label="ARR" />
        </QuickStatGrid>
      </QuickSection>

      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile
            icon="category"
            label="Type"
            value={
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', typeStyles[client.type])}>
                {client.type}
              </span>
            }
          />
          <QuickMetaTile icon="factory" label="Industry" value={client.industry} />
          <QuickMetaTile icon="public" label="Country" value={client.country} />
          <QuickMetaTile icon="payments" label="Revenue" value={formatMoney(client.arr ?? client.revenue)} />
        </div>
      </QuickSection>

      <QuickSection title="Related Information">
        <QuickRelatedRow icon="business" label="Client" value={client.name} />
        <QuickRelatedRow icon="sell" label="Type" value={client.type} />
        {client.chatLink && (
          <QuickRelatedRow
            icon="chat"
            label="Chat"
            value={
              <a
                href={client.chatLink}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-semibold hover:underline"
              >
                Open conversation
              </a>
            }
          />
        )}
      </QuickSection>
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
    isFetching,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    resetFilters,
    filtersActive,
    page,
    setPage,
    pageSize,
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

  const goDetail = (clientId: string) => {
    safeNavigate(navigate, {
      to: salesRoutes.clientDetail(clientId),
      params: { clientId },
    })
  }

  const goEdit = (clientId: string) => {
    safeNavigate(navigate, {
      to: salesRoutes.clientEdit(clientId),
      params: { clientId },
    })
  }

  const goNew = () => safeNavigate(navigate, { to: salesRoutes.clientNew })

  const openClientOverview = (client: Client) => {
    openPanel({
      title: client.name,
      subtitle: [client.industry, client.country].filter(Boolean).join(' · '),
      icon: 'apartment',
      status: client.status,
      statusDotClass: client.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
      content: <ClientQuickContent client={client} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goDetail(client.id),
      onEdit: () => goEdit(client.id),
      editLabel: 'Edit client',
      widthClass: 'max-w-[520px]',
    })
  }

  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Client Management"
        description="Manage client accounts, contacts, and commercial relationships."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">upload</span>}
            >
              Import
            </Button>
            <ExportButton
              resource={ResourceName.CLIENT}
              query={search}
              filters={{ status: statusFilter, type: typeFilter }}
              selectedIds={selectionMode ? Array.from(selectedIds) : undefined}
              filenameStem="clients"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
              onClick={goNew}
            >
              New Client
            </Button>
          </div>
        }
        showBack
        backTo={salesRoutes.clients}
        backLabel="Back to clients"
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

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, industry, or contact..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          aria-label="Filter by status"
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
          aria-label="Filter by type"
          options={[
            { value: 'All', label: 'All Types' },
            { value: 'Enterprise', label: 'Enterprise' },
            { value: 'SMB', label: 'SMB' },
            { value: 'Partner', label: 'Partner' },
          ]}
          minWidthClass="min-w-[140px]"
        />
      </ListToolbar>

      {selectionMode && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5">
          <span className="text-body-sm font-semibold text-on-surface">
            {selectedIds.size} selected
            <span className="text-on-surface-variant font-normal"> (of {filtered.length} on this page)</span>
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

      {isError && (
        <ErrorState
          title="Failed to load clients"
          description="We could not load the clients list. Check your connection and try again."
          onRetry={() => void refetch()}
          onBack={() => safeNavigate(navigate, { to: salesRoutes.clients })}
        />
      )}

      {!isError && (
        <div className="bv-surface overflow-hidden relative">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
              <TableSkeleton rows={6} />
            </div>
          )}
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
                        title="Select all on this page"
                        aria-label="Select all on this page"
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
                        <div className="flex justify-center">
                          <RowActions
                            label={`Actions for ${client.name}`}
                            actions={[
                              {
                                id: 'overview',
                                label: 'Quick view',
                                icon: 'visibility',
                                onClick: () => openClientOverview(client),
                              },
                              {
                                id: 'details',
                                label: 'View details',
                                icon: 'description',
                                onClick: () => goDetail(client.id),
                              },
                              {
                                id: 'edit',
                                label: 'Edit',
                                icon: 'edit',
                                onClick: () => goEdit(client.id),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-surface-container-low/30 border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant">
              Showing{' '}
              <span className="font-semibold text-on-surface">
                {rangeFrom}–{rangeTo}
              </span>{' '}
              of <span className="font-semibold text-on-surface">{totalCount}</span> clients
              {!selectionMode && (
                <span className="ml-2 text-on-surface-variant/80">· Hold a row 3s to multi-select</span>
              )}
            </p>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setPage}
            itemLabel="clients"
          />
        </div>
      )}
    </div>
  )
}
