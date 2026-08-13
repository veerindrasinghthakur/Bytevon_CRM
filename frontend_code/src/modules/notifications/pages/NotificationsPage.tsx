import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

type NotifType = 'APPROVAL' | 'ASSIGNMENT' | 'SYSTEM' | 'MENTION'

interface NotificationItem {
  id: number
  type: NotifType
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
  /** Extra fields for the side overview panel */
  actor?: string
  relatedTo?: string
  priority?: 'Low' | 'Medium' | 'High'
  status?: string
}

const MOCK: NotificationItem[] = [
  {
    id: 1,
    type: 'APPROVAL',
    title: 'Leave request pending your approval',
    body: 'Priya K. submitted 2 days of leave starting Aug 18.',
    createdAt: '2026-08-13T08:12:00Z',
    read: false,
    href: '/approvals/pending',
    actor: 'Priya K.',
    relatedTo: 'Leave · 2 days',
    priority: 'Medium',
    status: 'Pending',
  },
  {
    id: 2,
    type: 'ASSIGNMENT',
    title: 'You were assigned a task',
    body: '"Wire auth refresh flow" on Nexus Platform Migration.',
    createdAt: '2026-08-13T07:40:00Z',
    read: false,
    href: '/projects/tasks',
    actor: 'Project lead',
    relatedTo: 'Nexus Platform Migration',
    priority: 'High',
    status: 'Open',
  },
  {
    id: 3,
    type: 'MENTION',
    title: 'Mentioned in a project note',
    body: 'Marcus mentioned you on Client Onboarding Kit.',
    createdAt: '2026-08-12T16:05:00Z',
    read: true,
    href: '/projects',
    actor: 'Marcus S.',
    relatedTo: 'Client Onboarding Kit',
    priority: 'Low',
    status: 'Note',
  },
  {
    id: 4,
    type: 'SYSTEM',
    title: 'Password policy reminder',
    body: 'Your password is older than 90 days. Consider updating it from Profile.',
    createdAt: '2026-08-11T10:00:00Z',
    read: true,
    href: '/profile',
    actor: 'System',
    relatedTo: 'Security',
    priority: 'Medium',
    status: 'Reminder',
  },
  {
    id: 5,
    type: 'APPROVAL',
    title: 'Timesheet approved',
    body: 'Your timesheet for week of Aug 4 was approved.',
    createdAt: '2026-08-10T14:22:00Z',
    read: true,
    href: '/my-work/attendance',
    actor: 'Manager',
    relatedTo: 'Timesheet · week of Aug 4',
    priority: 'Low',
    status: 'Approved',
  },
]

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
  const [items, setItems] = useState(MOCK)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter]
  )
  const unreadCount = items.filter((n) => !n.read).length
  const selected = items.find((n) => n.id === selectedId) ?? null

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: number) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  const selectItem = (id: number) => {
    setSelectedId(id)
    markRead(id)
  }

  return (
    /* Center content when viewport / main area is narrow */
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
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </Button>
          </div>
        }
      />

      {/* List + side overview */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-[420px]">
        {/* List */}
        <div className="flex-1 min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          {visible.length === 0 && (
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
                    onClick={() => selectItem(n.id)}
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

        {/* Side overview bar */}
        <aside
          className={cn(
            'w-full lg:w-[300px] shrink-0 rounded-xl border border-outline-variant',
            'bg-surface-container-lowest flex flex-col overflow-hidden'
          )}
          aria-label="Notification overview"
        >
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">
                info
              </span>
              <p className="text-body-md font-medium text-on-background mb-1">Quick overview</p>
              <p className="text-body-sm text-on-surface-variant">
                Select a notification to see details here.
              </p>
            </div>
          ) : (
            <>
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
                {!selected.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => markRead(selected.id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      <p className="text-body-sm text-on-surface-variant text-center lg:text-left">
        V1 channels: In-app (and optional email). Preferences live on{' '}
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
