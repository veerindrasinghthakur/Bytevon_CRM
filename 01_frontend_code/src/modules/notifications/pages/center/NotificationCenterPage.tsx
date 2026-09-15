import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { useNotificationCenter } from '../../hooks/center/use-notification-center'
import type { AppNotification } from '../../types'
import { notificationStatusDotClass } from '../../schemas/enums'
import { notificationRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { NotificationQuickContent } from '../../components/center/NotificationQuickContent'
import { NotificationCard } from '../../components/center/NotificationCard'
import { CenterKpiCards } from '../../components/center/CenterKpiCards'
import { CenterFilterBar } from '../../components/center/CenterFilterBar'
import { NotificationPreviewPanel } from '../../components/center/NotificationPreviewPanel'

export function NotificationCenterPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const c = useNotificationCenter()

  const goDetail = (id: string) =>
    safeNavigate(navigate, {
      to: notificationRoutes.detailPath,
      params: { notificationId: id },
    })

  const openNotificationOverview = (n: AppNotification) => {
    c.selectNotification(n.id)
    openPanel({
      title: n.title,
      subtitle: [n.module, n.timeAgo].filter(Boolean).join(' · '),
      icon: n.icon || 'notifications',
      status: n.status,
      statusDotClass: notificationStatusDotClass(n.priority, n.status),
      content: <NotificationQuickContent n={n} />,
      fullRecordLabel: 'Open full detail',
      onOpenFull: () => goDetail(n.id),
      secondaryLabel: n.status === 'Unread' ? 'Mark as read' : undefined,
      onSecondary: n.status === 'Unread' ? () => c.markRead(n.id) : undefined,
      widthClass: 'max-w-[520px]',
    })
  }

  if (c.isLoading) {
    return <div className="py-16 text-center text-on-surface-variant">Loading notifications…</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-background tracking-tight">
            Notification Center
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            View, manage and respond to notifications across the organization.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButton
            resource={ResourceName.NOTIFICATION}
            query={c.query}
            filters={{
              type: c.typeFilter,
              priority: c.priorityFilter,
              module: c.moduleFilter,
              tab: c.tab,
            }}
            selectedIds={c.selectionMode ? Array.from(c.selectedIds) : undefined}
            filenameStem="notifications-inbox"
          />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">done_all</span>}
            onClick={() => c.markAllRead()}
          >
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">settings</span>}
            onClick={() => safeNavigate(navigate, { to: notificationRoutes.settings })}
          >
            Preferences
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">archive</span>}
            onClick={() => c.archiveRead()}
          >
            Archive Read
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => safeNavigate(navigate, { to: notificationRoutes.compose })}
          >
            Compose
          </Button>
        </div>
      </div>

      <CenterKpiCards kpis={c.kpis} />

      <CenterFilterBar
        tabs={c.tabs}
        tab={c.tab}
        setTab={c.setTab}
        query={c.query}
        setQuery={c.setQuery}
        typeFilter={c.typeFilter}
        setTypeFilter={c.setTypeFilter}
        priorityFilter={c.priorityFilter}
        setPriorityFilter={c.setPriorityFilter}
        moduleFilter={c.moduleFilter}
        setModuleFilter={c.setModuleFilter}
        modules={c.modules}
        filtersActive={c.filtersActive}
        resetFilters={c.resetFilters}
      />

      {c.selectionMode && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5 executive-shadow">
          <span className="text-body-sm font-semibold text-on-surface">
            {c.selectedCount} selected
            <span className="text-on-surface-variant font-normal"> (of {c.filtered.length} visible)</span>
          </span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={c.exitSelectionMode}>
            Cancel
          </Button>
          <ExportButton
            resource={ResourceName.NOTIFICATION}
            selectedIds={Array.from(c.selectedIds)}
            filenameStem="notifications-selected"
            label="Export selected"
          />
        </div>
      )}

      <section className="flex flex-col lg:flex-row gap-4 items-stretch min-h-[420px]">
        <div className="lg:w-2/5 flex flex-col gap-3 pr-1">
          {c.filtered.map((n) => (
            <NotificationCard
              key={n.id}
              n={n}
              active={c.selected?.id === n.id}
              selected={c.isSelected(n.id)}
              selectionMode={c.selectionMode}
              onSelect={() => {
                if (c.selectionMode) c.toggleOne(n.id)
                else openNotificationOverview(n)
              }}
              onPressStart={() => c.onRowPressStart(n.id)}
              onPressEnd={() => c.onRowPressEnd(n.id, () => openNotificationOverview(n))}
              onPressCancel={c.onRowPressCancel}
              onArchive={() => c.archiveOne(n.id)}
              onMarkRead={() => c.markRead(n.id)}
              onFullDetail={() => goDetail(n.id)}
              menuOpen={c.menuOpenId === n.id}
              onMenuToggle={() => c.setMenuOpenId(c.menuOpenId === n.id ? null : n.id)}
            />
          ))}
          {c.filtered.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
              No notifications match your filters.
            </div>
          )}
          {!c.selectionMode && c.filtered.length > 0 && (
            <p className="text-[11px] text-on-surface-variant px-1">Hold a card 3s to multi-select</p>
          )}
        </div>

        <NotificationPreviewPanel
          selected={c.selected}
          onMarkRead={c.markRead}
          onArchive={c.archiveOne}
          onOpenRelated={(href) => safeNavigate(navigate, { to: href as never })}
        />
      </section>
    </div>
  )
}
