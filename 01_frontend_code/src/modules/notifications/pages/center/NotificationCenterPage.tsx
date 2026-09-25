import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { useNotificationCenter } from '../../hooks/center/use-notification-center'
import { notificationRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { NotificationCard } from '../../components/center/NotificationCard'
import { CenterKpiCards } from '../../components/center/CenterKpiCards'
import { CenterFilterBar } from '../../components/center/CenterFilterBar'
import { NotificationInlineDetail } from '../../components/center/NotificationInlineDetail'

export function NotificationCenterPage() {
  const navigate = useNavigate()
  const c = useNotificationCenter()

  // Clicking an entry selects it (marks read) and shows its full detail in
  // the right section — no drawer, no separate preview bar.
  const openNotificationDetail = (id: string) => {
    c.selectNotification(id)
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
            resource={'notification'}
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
          <Can action={Action.UPDATE} resource="notification">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">done_all</span>}
              onClick={() => c.markAllRead()}
            >
              Mark All Read
            </Button>
          </Can>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">settings</span>}
            onClick={() => safeNavigate(navigate, { to: notificationRoutes.settings })}
          >
            Preferences
          </Button>
          <Can action={Action.UPDATE} resource="notification">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">archive</span>}
              onClick={() => c.archiveRead()}
            >
              Archive Read
            </Button>
          </Can>
          <Can action="CREATE" resource="notification" minScope="SELF">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
              onClick={() => safeNavigate(navigate, { to: notificationRoutes.compose })}
            >
              Compose
            </Button>
          </Can>
        </div>
      </div>

      <CenterKpiCards kpis={c.kpis} />

      <CenterFilterBar
        tabs={c.tabs}
        tab={c.tab}
        setTab={(id: string) => c.setTab(id as 'all' | 'unread' | 'high' | 'mentions' | 'archived')}
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
            resource={'notification'}
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
                else openNotificationDetail(n.id)
              }}
              onPressStart={() => c.onRowPressStart(n.id)}
              onPressEnd={() => c.onRowPressEnd(n.id, () => openNotificationDetail(n.id))}
              onPressCancel={c.onRowPressCancel}
              onDelete={() => c.deleteOne(n.id)}
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

        <NotificationInlineDetail
          notificationId={c.selected?.id ?? null}
          fallback={c.selected}
          onMarkRead={c.markRead}
          onArchive={c.archiveOne}
          onDelete={c.deleteOne}
          markReadPending={c.markReadPending}
          onOpenRelated={(href) => safeNavigate(navigate, { to: href as never })}
        />
      </section>
    </div>
  )
}
