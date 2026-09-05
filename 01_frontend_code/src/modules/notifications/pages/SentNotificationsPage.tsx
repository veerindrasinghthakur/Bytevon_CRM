import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { useSentNotifications } from '../hooks/use-sent-notifications'
import { deliveryStatusStyles } from '../schemas/enums'
import { notificationRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import type { DeliveryStatus } from '../types'

export function SentNotificationsPage() {
  const navigate = useNavigate()
  const s = useSentNotifications()

  if (s.isLoading) {
    return <div className="py-16 text-center text-on-surface-variant">Loading sent log…</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-background tracking-tight">Sent Notifications</h1>
          <p className="text-on-surface-variant text-body-md mt-1">
            Monitor delivery performance and engagement for outgoing communications.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButton
            resource={ResourceName.NOTIFICATION}
            query={s.search}
            filters={{ type: s.typeFilter, status: s.statusFilter }}
            selectedIds={s.selectionMode ? Array.from(s.selectedIds) : undefined}
            filenameStem="notifications-sent"
          />
          <Button
            variant="primary"
            size="md"
            leftIcon={<span className="material-symbols-outlined">add_circle</span>}
            onClick={() => safeNavigate(navigate, { to: notificationRoutes.compose })}
          >
            Compose Notification
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {s.kpis.map((k) => (
          <div key={k.id} className={cn('bv-surface card-hover p-6', k.danger && 'border-l-4 border-l-error')}>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant text-label-md uppercase tracking-wider">{k.label}</span>
              <div
                className={cn(
                  'p-2 rounded-lg',
                  k.danger ? 'bg-error-container text-error' : 'bg-surface-container-highest text-secondary',
                )}
              >
                <span className="material-symbols-outlined">{k.icon}</span>
              </div>
            </div>
            <h3
              className={cn(
                'text-headline-lg font-bold mt-4 tracking-tight',
                k.danger ? 'text-error' : 'text-on-background',
              )}
            >
              {k.value}
            </h3>
            {k.hint && (
              <p className={cn('text-label-sm mt-1', k.danger ? 'text-error font-bold' : 'text-secondary')}>
                {k.hint}
              </p>
            )}
          </div>
        ))}
      </div>

      {s.selectionMode && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5 executive-shadow">
          <span className="text-body-sm font-semibold text-on-surface">
            {s.selectedCount} selected
            <span className="text-on-surface-variant font-normal"> (of {s.rows.length} on this page)</span>
          </span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={s.exitSelectionMode}>
            Cancel
          </Button>
          <ExportButton
            resource={ResourceName.NOTIFICATION}
            selectedIds={Array.from(s.selectedIds)}
            filenameStem="notifications-sent-selected"
            label="Export selected"
          />
        </div>
      )}

      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg outline-none text-body-sm focus:ring-1 focus:ring-secondary"
              placeholder="Search by recipient or title..."
              value={s.search}
              onChange={(e) => s.setSearch(e.target.value)}
            />
          </div>
          <Select
            value={s.typeFilter}
            onChange={s.setTypeFilter}
            minWidthClass="min-w-[130px]"
            options={[
              { value: 'All', label: 'All Types' },
              { value: 'Email', label: 'Email' },
              { value: 'In-App', label: 'In-App' },
              { value: 'Push', label: 'Push' },
              { value: 'SMS', label: 'SMS' },
            ]}
          />
          <Select
            value={s.statusFilter}
            onChange={s.setStatusFilter}
            minWidthClass="min-w-[130px]"
            options={[
              { value: 'All', label: 'All Status' },
              { value: 'Delivered', label: 'Delivered' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Failed', label: 'Failed' },
            ]}
          />
          {s.filtersActive && (
            <Button variant="outline" size="sm" onClick={s.resetFilters}>
              Reset
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-3 py-4 w-12 text-center">
                  {s.selectionMode ? (
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-secondary"
                      checked={s.allFilteredSelected}
                      onChange={s.toggleSelectAllFiltered}
                      aria-label="Select all on page"
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </th>
                {['Recipient', 'Notification Title', 'Status', 'Type', 'Sent Date/Time'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-label-md text-on-surface-variant font-bold uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {s.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    No sent notifications match your filters.
                  </td>
                </tr>
              ) : (
                s.rows.map((r) => {
                  const isSelected = s.isSelected(r.id)
                  return (
                    <tr
                      key={r.id}
                      className={cn('zebra-row select-none cursor-pointer', isSelected && 'bg-secondary/10')}
                      onMouseDown={() => s.onRowPressStart(r.id)}
                      onMouseUp={() => s.onRowPressEnd(r.id)}
                      onMouseLeave={s.onRowPressCancel}
                      onTouchStart={() => s.onRowPressStart(r.id)}
                      onTouchEnd={() => s.onRowPressEnd(r.id)}
                      onTouchCancel={s.onRowPressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={() => {
                        if (s.selectionMode) s.toggleOne(r.id)
                      }}
                    >
                      <td
                        className="px-3 py-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (s.selectionMode) s.toggleOne(r.id)
                        }}
                      >
                        {s.selectionMode && (
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-secondary"
                            checked={isSelected}
                            onChange={() => s.toggleOne(r.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary font-bold text-xs">
                            {r.initials ?? r.recipientName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-label-md font-bold text-on-background">{r.recipientName}</p>
                            <p className="text-label-sm text-on-surface-variant">{r.recipientContact}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-label-md text-on-background font-medium">{r.title}</p>
                        <p className="text-on-surface-variant text-[11px] truncate max-w-[220px]">{r.preview}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-lg">
                            {r.type === 'Email'
                              ? 'mail'
                              : r.type === 'SMS'
                                ? 'sms'
                                : r.type === 'In-App'
                                  ? 'dashboard'
                                  : 'notifications'}
                          </span>
                          <span className="text-label-sm">{r.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-label-sm">{r.sentAt}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!s.selectionMode && s.rows.length > 0 && (
          <div className="px-6 py-2 border-t border-outline-variant text-[11px] text-on-surface-variant">
            Hold a row 3s to multi-select
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: DeliveryStatus | string }) {
  const styles =
    deliveryStatusStyles[status as DeliveryStatus] ?? deliveryStatusStyles.Pending
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold', styles.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', styles.dot)} />
      {status}
    </span>
  )
}
