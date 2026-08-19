import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { inboxNotifications, notificationKpis } from '../data/mock'
import type { AppNotification } from '../types'
import { cn } from '@/shared/lib/cn'

type TabId = 'all' | 'unread' | 'mentions' | 'high' | 'archived'

export function NotificationCenterPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('all')
  const [selectedId, setSelectedId] = useState(inboxNotifications[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(inboxNotifications)

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (tab === 'unread' && n.status !== 'Unread') return false
      if (tab === 'high' && n.priority !== 'High' && n.priority !== 'Critical') return false
      if (tab === 'archived' && n.status !== 'Archived') return false
      if (tab === 'mentions') return n.body.toLowerCase().includes('@') || n.title.includes('Mention')
      if (query) {
        const q = query.toLowerCase()
        return (
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.module.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [items, tab, query])

  const selected = filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, status: n.status === 'Archived' ? n.status : 'Read' })))
  }

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'Read' } : n)))
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: `All (${items.length})` },
    { id: 'unread', label: `Unread (${items.filter((n) => n.status === 'Unread').length})` },
    { id: 'mentions', label: 'Mentions (0)' },
    { id: 'high', label: `High Priority (${items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length})` },
    { id: 'archived', label: 'Archived' },
  ]

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
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">done_all</span>} onClick={markAllRead}>
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">settings</span>}
            onClick={() => navigate({ to: '/notifications/settings' })}
          >
            Preferences
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/notifications/compose' })}
          >
            Compose
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {notificationKpis.map((k) => (
          <div key={k.id} className="bv-surface card-hover p-5 cursor-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-on-surface-variant text-label-md">{k.label}</span>
              <span className="material-symbols-outlined text-secondary text-xl">{k.icon}</span>
            </div>
            <p className="text-headline-md font-semibold text-deep-navy">{k.value}</p>
            <p
              className={cn(
                'text-[11px] font-bold mt-1',
                k.hintTone === 'positive' && 'text-success-emerald',
                k.hintTone === 'danger' && 'text-error',
                k.hintTone === 'neutral' && 'text-on-surface-variant'
              )}
            >
              {k.hint}
            </p>
          </div>
        ))}
      </section>

      <section className="bv-surface p-2">
        <div className="flex items-center gap-1 border-b border-outline-variant px-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-5 py-3 text-label-md whitespace-nowrap transition-colors border-b-2',
                tab === t.id
                  ? 'border-secondary text-secondary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-deep-navy'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 px-3 py-3">
          <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant px-3 py-1.5 flex-1 max-w-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-body-sm w-full outline-none"
              placeholder="Filter notifications..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-secondary transition-colors">
            <option>Type: All</option>
            <option>System</option>
            <option>Approval</option>
            <option>Mention</option>
          </select>
          <select className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-secondary transition-colors">
            <option>Priority: All</option>
            <option>High</option>
            <option>Normal</option>
            <option>Low</option>
          </select>
        </div>
      </section>

      <section className="flex flex-col lg:flex-row gap-4 min-h-[480px]">
        <div className="lg:w-2/5 flex flex-col gap-3 overflow-y-auto max-h-[640px] pr-1">
          {filtered.map((n) => (
            <NotificationCard
              key={n.id}
              n={n}
              active={selected?.id === n.id}
              onSelect={() => {
                setSelectedId(n.id)
                if (n.status === 'Unread') markRead(n.id)
              }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
              No notifications match your filters.
            </div>
          )}
        </div>

        <div className="flex-1 bv-surface flex flex-col overflow-hidden min-h-[400px]">
          {selected ? (
            <>
              <div className="p-6 border-b border-outline-variant flex items-start justify-between gap-4 bg-surface-container-low">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary shrink-0">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {selected.icon}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-headline-md font-semibold text-deep-navy">{selected.title}</h2>
                    <p className="text-label-md text-on-surface-variant mt-1">
                      {selected.actor && <span className="font-semibold text-deep-navy">{selected.actor}</span>}
                      {selected.employeeId && <> • {selected.employeeId}</>}
                      {' • '}{selected.module}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-secondary text-label-md font-semibold hover:underline"
                  onClick={() => navigate({ to: '/notifications/$notificationId', params: { notificationId: selected.id } })}
                >
                  Full detail
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selected.meta?.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-label-md border-b border-dashed border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-semibold">{m.label}</span>
                    <span className="text-deep-navy font-medium">{m.value}</span>
                  </div>
                ))}
                <p className="text-body-md text-on-surface leading-relaxed">{selected.body}</p>
                {selected.note && (
                  <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-secondary">
                    <h5 className="text-label-md font-bold uppercase text-secondary mb-2 tracking-wider">Note</h5>
                    <p className="text-body-md text-on-surface italic leading-relaxed">"{selected.note}"</p>
                  </div>
                )}
                {selected.timeline && selected.timeline.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-label-md font-bold uppercase text-on-surface-variant tracking-widest">Activity Timeline</h5>
                    <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                      {selected.timeline.map((t) => (
                        <div key={t.title} className="relative">
                          <div
                            className={cn(
                              'absolute -left-8 top-1 w-6 h-6 rounded-full bg-surface-container-lowest border-4 z-10',
                              t.active ? 'border-secondary' : 'border-outline-variant'
                            )}
                          />
                          <p className="text-body-md font-bold text-deep-navy">{t.title}</p>
                          <p className="text-label-sm text-on-surface-variant">{t.time}</p>
                          <p className="text-body-sm mt-1 text-on-surface-variant">{t.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center gap-3">
                <Button variant="primary" size="md" className="flex-1 min-w-[140px]">
                  Open Related Record
                </Button>
                <Button variant="outline" size="md" onClick={() => markRead(selected.id)}>
                  Mark as Read
                </Button>
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

function NotificationCard({
  n,
  active,
  onSelect,
}: {
  n: AppNotification
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'text-left rounded-xl p-5 border transition-all duration-200 relative',
        active
          ? 'bg-surface-container-high border-2 border-secondary executive-shadow'
          : 'bv-surface hover:border-secondary/50',
        n.status === 'Read' && !active && 'opacity-80'
      )}
    >
      {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r" />}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
            active ? 'bg-secondary-container text-on-secondary' : 'bg-surface-container-highest text-deep-navy'
          )}
        >
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
            <PriorityBadge priority={n.priority} />
            {n.tags?.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded uppercase">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

function PriorityBadge({ priority }: { priority: AppNotification['priority'] }) {
  const styles =
    priority === 'Critical' || priority === 'High'
      ? 'bg-error-container text-on-error-container'
      : priority === 'Normal'
        ? 'bg-surface-container text-on-surface-variant'
        : 'bg-secondary-container/20 text-secondary'
  return (
    <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded uppercase', styles)}>{priority}</span>
  )
}

/** Keep legacy export name used by router */
export { NotificationCenterPage as NotificationsPage }
