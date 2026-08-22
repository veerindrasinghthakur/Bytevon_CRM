import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { useNotificationCenter } from '../hooks/use-notification-center'
import type { AppNotification } from '../types'
import { cn } from '@/shared/lib/cn'

export function NotificationCenterPage() {
  const navigate = useNavigate()
  const c = useNotificationCenter()

  if (c.isLoading) {
    return <div className="py-16 text-center text-on-surface-variant">Loading notifications…</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold text-deep-navy tracking-tight">Notification Center</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            View, manage and respond to notifications across the organization.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">done_all</span>} onClick={() => c.markAllRead()}>
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">settings</span>} onClick={() => navigate({ to: '/notifications/settings' })}>
            Preferences
          </Button>
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">archive</span>} onClick={() => c.archiveRead()}>
            Archive Read
          </Button>
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>} onClick={() => navigate({ to: '/notifications/compose' })}>
            Compose
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {c.kpis.map((k) => (
          <div key={k.id} className="bv-surface card-hover p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-on-surface-variant text-label-md">{k.label}</span>
              <span className={cn('material-symbols-outlined text-xl', k.hintTone === 'danger' ? 'text-error' : 'text-secondary')}>{k.icon}</span>
            </div>
            <p className="text-headline-md font-semibold text-deep-navy">{k.value}</p>
            <p className={cn('text-[11px] font-bold mt-1', k.hintTone === 'positive' && 'text-success-emerald', k.hintTone === 'danger' && 'text-error', k.hintTone === 'neutral' && 'text-on-surface-variant')}>{k.hint}</p>
          </div>
        ))}
      </section>

      <section className="bv-surface p-2">
        <div className="flex items-center gap-1 border-b border-outline-variant px-2 overflow-x-auto">
          {c.tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => c.setTab(t.id)} className={cn('px-5 py-3 text-label-md whitespace-nowrap transition-colors border-b-2', c.tab === t.id ? 'border-secondary text-secondary font-bold' : 'border-transparent text-on-surface-variant hover:text-deep-navy')}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3 px-3 py-3">
          <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant px-3 h-11 flex-1 min-w-[160px] max-w-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input className="bg-transparent border-none text-body-sm w-full outline-none" placeholder="Filter notifications..." value={c.query} onChange={(e) => c.setQuery(e.target.value)} />
          </div>
          <Select value={c.typeFilter} onChange={c.setTypeFilter} minWidthClass="min-w-[130px]" options={[{ value: 'All', label: 'Type: All' }, { value: 'System', label: 'System' }, { value: 'Approval', label: 'Approval' }, { value: 'Mention', label: 'Mention' }]} />
          <Select value={c.priorityFilter} onChange={c.setPriorityFilter} minWidthClass="min-w-[130px]" options={[{ value: 'All', label: 'Priority: All' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
          <Select value={c.moduleFilter} onChange={c.setModuleFilter} minWidthClass="min-w-[130px]" options={[{ value: 'All', label: 'Module: All' }, ...c.modules.map((m) => ({ value: m, label: m }))]} />
          {c.filtersActive && (
            <Button variant="outline" size="sm" onClick={c.resetFilters}>Reset</Button>
          )}
        </div>
      </section>

      <section className="flex flex-col lg:flex-row gap-4 h-[min(70vh,640px)]">
        <div className="lg:w-2/5 flex flex-col gap-3 overflow-y-auto h-full pr-1">
          {c.filtered.map((n) => (
            <NotificationCard key={n.id} n={n} active={c.selected?.id === n.id} onSelect={() => c.selectNotification(n.id)} onArchive={() => c.archiveOne(n.id)} onMarkRead={() => c.markRead(n.id)} menuOpen={c.menuOpenId === n.id} onMenuToggle={() => c.setMenuOpenId(c.menuOpenId === n.id ? null : n.id)} />
          ))}
          {c.filtered.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">No notifications match your filters.</div>
          )}
        </div>

        <div className="flex-1 bv-surface flex flex-col overflow-hidden h-full min-h-0">
          {c.selected ? (
            <>
              <div className="p-6 border-b border-outline-variant flex items-start justify-between gap-4 bg-surface-container-low shrink-0">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary shrink-0">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{c.selected.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-headline-md font-semibold text-deep-navy truncate">{c.selected.title}</h2>
                    <p className="text-label-md text-on-surface-variant mt-1">
                      {c.selected.actor && <span className="font-semibold text-deep-navy">{c.selected.actor}</span>}
                      {c.selected.employeeId && <> · {c.selected.employeeId}</>}
                      {' · '}{c.selected.module}
                    </p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <button type="button" className="p-2 text-on-surface-variant hover:text-deep-navy" aria-label="More" onClick={() => c.setMenuOpenId(c.menuOpenId === 'detail' ? null : 'detail')}>
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {c.menuOpenId === 'detail' && (
                    <div className="absolute right-0 top-10 z-20 bv-surface border border-outline-variant rounded-lg executive-shadow py-1 min-w-[160px]">
                      <button type="button" className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container" onClick={() => { c.markRead(c.selected!.id); c.setMenuOpenId(null) }}>Mark as read</button>
                      <button type="button" className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container" onClick={() => { c.archiveOne(c.selected!.id); c.setMenuOpenId(null) }}>Archive</button>
                      <button type="button" className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container" onClick={() => { navigate({ to: '/notifications/$notificationId', params: { notificationId: c.selected!.id } }); c.setMenuOpenId(null) }}>Full detail</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                {c.selected.meta?.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-label-md border-b border-dashed border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-semibold">{m.label}</span>
                    <span className="text-deep-navy font-medium">{m.value}</span>
                  </div>
                ))}
                <p className="text-body-md text-on-surface leading-relaxed">{c.selected.body}</p>
                {c.selected.note && (
                  <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-secondary">
                    <h5 className="text-label-md font-bold uppercase text-secondary mb-2 tracking-wider">Note</h5>
                    <p className="text-body-md text-on-surface italic">"{c.selected.note}"</p>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center gap-3 shrink-0">
                <Button variant="primary" size="md" className="flex-1 min-w-[140px]" disabled={!c.selected.relatedHref} onClick={() => { if (c.selected?.relatedHref) navigate({ to: c.selected.relatedHref as never }) }}>
                  Open Related Record
                </Button>
                <Button variant="outline" size="md" onClick={() => c.markRead(c.selected!.id)}>Mark as Read</Button>
                <button type="button" className="p-3 bg-error-container text-on-error-container rounded-xl" onClick={() => c.archiveOne(c.selected!.id)} aria-label="Archive">
                  <span className="material-symbols-outlined">delete_outline</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant">Select a notification</div>
          )}
        </div>
      </section>
    </div>
  )
}

function NotificationCard({ n, active, onSelect, onArchive, onMarkRead, menuOpen, onMenuToggle }: { n: AppNotification; active: boolean; onSelect: () => void; onArchive: () => void; onMarkRead: () => void; menuOpen: boolean; onMenuToggle: () => void }) {
  return (
    <div className={cn('text-left rounded-xl p-5 border transition-all relative', active ? 'bg-surface-container-high border-2 border-secondary executive-shadow' : 'bv-surface hover:border-secondary/50', n.status === 'Read' && !active && 'opacity-80')}>
      {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r" />}
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', active ? 'bg-secondary-container text-on-secondary' : 'bg-surface-container-highest text-deep-navy')}>
            <span className="material-symbols-outlined text-2xl">{n.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-[10px] font-black uppercase text-secondary tracking-widest truncate">{n.module}</span>
              <span className="text-[11px] text-on-surface-variant shrink-0">{n.timeAgo}</span>
            </div>
            <h4 className="text-title-lg font-semibold text-deep-navy line-clamp-1">{n.title}</h4>
            <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-1">{n.body}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded uppercase', n.priority === 'Critical' || n.priority === 'High' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface-variant')}>{n.priority === 'Critical' ? 'Urgent' : n.priority}</span>
            </div>
          </div>
        </div>
      </button>
      <div className="absolute top-3 right-3">
        <button type="button" className="p-1 rounded hover:bg-surface-container text-on-surface-variant" aria-label="Actions" onClick={(e) => { e.stopPropagation(); onMenuToggle() }}>
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 bv-surface border border-outline-variant rounded-lg executive-shadow py-1 min-w-[140px]">
            <button type="button" className="w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container" onClick={(e) => { e.stopPropagation(); onMarkRead(); onMenuToggle() }}>Mark as read</button>
            <button type="button" className="w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container" onClick={(e) => { e.stopPropagation(); onArchive(); onMenuToggle() }}>Archive</button>
          </div>
        )}
      </div>
    </div>
  )
}

export { NotificationCenterPage as NotificationsPage }
