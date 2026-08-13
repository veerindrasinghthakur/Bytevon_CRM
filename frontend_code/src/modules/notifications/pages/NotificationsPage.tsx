import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotifType,
  type NotificationItem,
} from '../api/notifications'

const TYPE_META: Record<
  NotifType,
  { icon: string; label: string; tone: string }
> = {
  APPROVAL: { icon: 'fact_check', label: 'Approval', tone: 'text-secondary bg-secondary/10' },
  ASSIGNMENT: { icon: 'assignment', label: 'Assignment', tone: 'text-electric-blue bg-electric-blue/10' },
  SYSTEM: { icon: 'settings', label: 'System', tone: 'text-on-surface-variant bg-surface-container' },
  MENTION: { icon: 'alternate_email', label: 'Mention', tone: 'text-amber-700 bg-amber-50' },
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNotifications()
      setItems(res.items)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter]
  )
  const unreadCount = items.filter((n) => !n.read).length
  const selected = items.find((n) => n.id === selectedId) ?? null

  const markAllRead = async () => {
    await markAllNotificationsRead()
    await reload()
  }

  const selectItem = async (id: number) => {
    setSelectedId(id)
    await markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="My Notifications"
        description="In-app alerts for approvals, assignments, and system updates."
        showBack
        backTo="/dashboard"
        backLabel="Back"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filter === 'all' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void markAllRead()} disabled={unreadCount === 0}>
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-[320px]">
        <div
          className={cn(
            'min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden',
            selected ? 'flex-1' : 'w-full'
          )}
        >
          {loading && (
            <p className="p-8 text-body-sm text-on-surface-variant text-center">Loading…</p>
          )}
          {!loading && visible.length === 0 && (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">
                notifications_off
              </span>
              <p className="text-body-md text-on-surface-variant">
                {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
              </p>
            </div>
          )}

          <ul className="divide-y divide-outline-variant/40">
            {visible.map((n) => {
              const meta = TYPE_META[n.type]
              const isSelected = selectedId === n.id
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void selectItem(n.id)}
                    className={cn(
                      'w-full text-left flex items-start gap-4 px-5 py-4',
                      'hover:bg-surface-container/60',
                      isSelected && 'bg-[#e8f1ff] border-l-4 border-secondary',
                      !isSelected && !n.read && 'bg-secondary/5',
                      !isSelected && 'border-l-4 border-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        meta.tone
                      )}
                    >
                      <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={cn(
                            'text-body-md text-on-background',
                            !n.read && 'font-semibold'
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="text-label-sm text-on-surface-variant whitespace-nowrap">
                          {formatWhen(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>
                      <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {meta.label}
                      </span>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-2" title="Unread" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {selected && (
          <aside
            className="w-full lg:w-[300px] shrink-0 rounded-xl border border-outline-variant bg-surface-container-lowest flex flex-col overflow-hidden"
            aria-label="Notification overview"
          >
            <div className="px-5 py-4 border-b border-outline-variant flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Overview
                </p>
                <h3 className="text-title-lg text-on-background leading-snug">{selected.title}</h3>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container shrink-0"
                aria-label="Close overview"
                onClick={() => setSelectedId(null)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm font-semibold',
                  TYPE_META[selected.type].tone
                )}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {TYPE_META[selected.type].icon}
                </span>
                {TYPE_META[selected.type].label}
              </div>

              <p className="text-body-md text-on-surface-variant">{selected.body}</p>

              <dl className="space-y-3 text-body-sm">
                <OverviewRow label="When" value={formatWhen(selected.createdAt)} />
                <OverviewRow label="From" value={selected.actor ?? '—'} />
                <OverviewRow label="Related" value={selected.relatedTo ?? '—'} />
                <OverviewRow label="Priority" value={selected.priority ?? '—'} />
                <OverviewRow label="Status" value={selected.status ?? '—'} />
                <OverviewRow label="Read" value={selected.read ? 'Yes' : 'No'} />
              </dl>
            </div>

            <div className="p-4 border-t border-outline-variant flex flex-col gap-2">
              {selected.href && (
                <Link to={selected.href} className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    Open related
                  </Button>
                </Link>
              )}
            </div>
          </aside>
        )}
      </div>

      <p className="text-body-sm text-on-surface-variant text-center lg:text-left">
        Data from <code className="text-label-sm">shared/mock/mock-data.json</code>. Preferences on{' '}
        <Link to="/profile" className="text-secondary hover:underline">
          Profile
        </Link>
        .
      </p>
    </div>
  )
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-on-surface-variant shrink-0">{label}</dt>
      <dd className="text-on-background font-medium text-right">{value}</dd>
    </div>
  )
}
