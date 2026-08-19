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
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [items, setItems] = useState(inboxNotifications)

  const unreadCount = items.filter((n) => n.status === 'Unread').length
  const highCount = items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (tab === 'unread' && n.status !== 'Unread') return false
      if (tab === 'high' && n.priority !== 'High' && n.priority !== 'Critical') return false
      if (tab === 'archived' && n.status !== 'Archived') return false
      if (tab === 'mentions') {
        const mention =
          n.body.toLowerCase().includes('@') ||
          n.title.toLowerCase().includes('mention') ||
          (n.tags ?? []).some((t) => t.toLowerCase().includes('mention'))
        if (!mention) return false
      }
      if (priorityFilter === 'High' && n.priority !== 'High' && n.priority !== 'Critical') return false
      if (priorityFilter === 'Medium' && n.priority !== 'Normal') return false
      if (priorityFilter === 'Low' && n.priority !== 'Low') return false
      if (moduleFilter !== 'All' && n.module !== moduleFilter) return false
      if (typeFilter === 'System' && n.module !== 'System') return false
      if (typeFilter === 'Approval' && !n.title.toLowerCase().includes('leave') && !n.title.toLowerCase().includes('request'))
        return false
      if (typeFilter === 'Mention' && !n.body.includes('@')) return false
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
  }, [items, tab, query, typeFilter, priorityFilter, moduleFilter])

  const selected = filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, status: n.status === 'Archived' ? n.status : 'Read' })))
  }

  const archiveRead = () => {
    setItems((prev) =>
      prev.map((n) => (n.status === 'Read' ? { ...n, status: 'Archived' } : n)),
    )
  }

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'Read' } : n)))
  }

  const archiveOne = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'Archived' } : n)))
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: `All (${items.length})` },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'mentions', label: 'Mentions (0)' },
    { id: 'high', label: `High Priority (${highCount})` },
    { id: 'archived', label: 'Archived' },
  ]

  const modules = Array.from(new Set(items.map((n) => n.module)))

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
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">done_all</span>}
            onClick={markAllRead}
          >
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
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">archive</span>}
            onClick={archiveRead}
          >
            Archive Read
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
              <span
                className={cn(
                  'material-symbols-outlined text-xl',
                  k.hintTone === 'danger' ? 'text-error' : 'text-secondary',
                )}
              >
                {k.icon}
              </span>
            </div>
            <p className="text-headline-md font-semibold text-deep-navy">{k.value}</p>
            <p
              className={cn(
                'text-[11px] font-bold mt-1',
                k.hintTone === 'positive' && 'text-success-emerald',
                k.hintTone === 'danger' && 'text-error',
                k.hintTone === 'neutral' && 'text-on-surface-variant',
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
                  : 'border-transparent text-on-surface-variant hover:text-deep-navy',
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-secondary"
          >
            <option value="All">Type: All</option>
            <option value="System">System</option>
            <option value="Approval">Approval</option>
            <option value="Mention">Mention</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-secondary"
          >
            <option value="All">Priority: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-secondary"
          >
            <option value="All">Module: All</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ml-auto text-on-surface-variant flex items-center gap-1 text-label-sm font-bold"
          >
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Date range
          </button>
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
              onArchive={() => archiveOne(n.id)}
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
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {selected.icon}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-headline-md font-semibold text-deep-navy">{selected.title}</h2>
                    <p className="text-label-md text-on-surface-variant mt-1">
                      {selected.actor && (
                        <span className="font-semibold text-deep-navy">{selected.actor}</span>
                      )}
                      {selected.employeeId && <> · {selected.employeeId}</>}
                      {' · '}{selected.module}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 text-on-surface-variant hover:text-deep-navy">
                    <span className="material-symbols-outlined">star</span>
                  </button>
                  <button type="button" className="p-2 text-on-surface-variant hover:text-deep-navy">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                  <button
                    type="button"
                    className="text-secondary text-label-md font-semibold hover:underline px-2"
                    onClick={() =>
                      navigate({
                        to: '/notifications/$notificationId',
                        params: { notificationId: selected.id },
                      })
                    }
                  >
                    Full detail
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selected.meta?.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between text-label-md border-b border-dashed border-outline-variant pb-2"
                  >
                    <span className="text-on-surface-variant font-semibold">{m.label}</span>
                    <span className="text-deep-navy font-medium">{m.value}</span>
                  </div>
                ))}
                <p className="text-body-md text-on-surface leading-relaxed">{selected.body}</p>
                {selected.note && (
                  <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-secondary">
                    <h5 className="text-label-md font-bold uppercase text-secondary mb-2 tracking-wider">
                      Note
                    </h5>
                    <p className="text-body-md text-on-surface italic leading-relaxed">
                      &quot;{selected.note}&quot;
                    </p>
                  </div>
                )}
                {selected.timeline && selected.timeline.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-label-md font-bold uppercase text-on-surface-variant tracking-widest">
                      Activity Timeline
                    </h5>
                    <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                      {selected.timeline.map((t) => (
                        <div key={t.title} className="relative">
                          <div
                            className={cn(
                              'absolute -left-8 top-1 w-6 h-6 rounded-full bg-surface-container-lowest border-4 z-10',
                              t.active ? 'border-secondary' : 'border-outline-variant',
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
                <button
                  type="button"
                  className="p-3 bg-error-container text-on-error-container rounded-xl hover:opacity-80"
                  onClick={() => archiveOne(selected.id)}
                  aria-label="Delete or archive"
                >
                  <span className="material-symbols-outlined">delete_outline</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant">
              Select a notification
            </div>
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
  onArchive,
}: {
  n: AppNotification
  active: boolean
  onSelect: () => void
  onArchive: () => void
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
        n.status === 'Read' && !active && 'opacity-80',
      )}
    >
      {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r" />}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
            active
              ? 'bg-secondary-container text-on-secondary'
              : 'bg-surface-container-highest text-deep-navy',
          )}
        >
          <span className="material-symbols-outlined text-2xl">{n.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-[10px] font-black uppercase text-secondary tracking-widest truncate">
              {n.module}
            </span>
            <span className="text-[11px] text-on-surface-variant shrink-0">{n.timeAgo}</span>
          </div>
          <h4 className="text-title-lg font-semibold text-deep-navy line-clamp-1">{n.title}</h4>
          <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-1">{n.body}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <PriorityBadge priority={n.priority} />
            {n.tags?.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded uppercase"
              >
                {t}
              </span>
            ))}
            {n.status === 'Read' && !active && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    onArchive()
                  }
                }}
                className="ml-auto flex items-center gap-1 text-secondary text-xs font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-sm">archive</span> Archive
              </span>
            )}
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
    <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded uppercase', styles)}>
      {priority === 'Critical' ? 'Urgent' : priority}
    </span>
  )
}

export { NotificationCenterPage as NotificationsPage }
