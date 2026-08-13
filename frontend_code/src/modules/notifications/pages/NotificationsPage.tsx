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
  },
  {
    id: 2,
    type: 'ASSIGNMENT',
    title: 'You were assigned a task',
    body: '"Wire auth refresh flow" on Nexus Platform Migration.',
    createdAt: '2026-08-13T07:40:00Z',
    read: false,
    href: '/projects/tasks',
  },
  {
    id: 3,
    type: 'MENTION',
    title: 'Mentioned in a project note',
    body: 'Marcus mentioned you on Client Onboarding Kit.',
    createdAt: '2026-08-12T16:05:00Z',
    read: true,
    href: '/projects',
  },
  {
    id: 4,
    type: 'SYSTEM',
    title: 'Password policy reminder',
    body: 'Your password is older than 90 days. Consider updating it from Profile.',
    createdAt: '2026-08-11T10:00:00Z',
    read: true,
    href: '/profile',
  },
  {
    id: 5,
    type: 'APPROVAL',
    title: 'Timesheet approved',
    body: 'Your timesheet for week of Aug 4 was approved.',
    createdAt: '2026-08-10T14:22:00Z',
    read: true,
    href: '/my-work/attendance',
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

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter]
  )
  const unreadCount = items.filter((n) => !n.read).length

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: number) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="My Notifications"
        description="In-app alerts for approvals, assignments, and system updates."
        showBack
        backTo="/dashboard"
        backLabel="Back"
        actions={
          <div className="flex items-center gap-2">
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

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
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
            const inner = (
              <>
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
                  <p className="text-body-sm text-on-surface-variant mt-0.5">{n.body}</p>
                  <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {meta.label}
                  </span>
                </div>
                {!n.read && (
                  <span
                    className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-2"
                    title="Unread"
                  />
                )}
              </>
            )

            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    to={n.href}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'flex items-start gap-4 px-5 py-4 hover:bg-surface-container/60',
                      !n.read && 'bg-secondary/5'
                    )}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-surface-container/60',
                      !n.read && 'bg-secondary/5'
                    )}
                  >
                    {inner}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <p className="text-body-sm text-on-surface-variant">
        V1 channels: In-app (and optional email). Preferences live on{' '}
        <Link to="/profile" className="text-secondary hover:underline">
          Profile
        </Link>
        .
      </p>
    </div>
  )
}
