import { delay, getDb } from '@/shared/mock/db'

export type NotifType = 'APPROVAL' | 'ASSIGNMENT' | 'SYSTEM' | 'MENTION'

export interface NotificationItem {
  id: number
  type: NotifType
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
  actor?: string
  relatedTo?: string
  priority?: 'Low' | 'Medium' | 'High'
  status?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asNotif(row: any): NotificationItem {
  return {
    id: row.id,
    type: row.type as NotifType,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    read: Boolean(row.read),
    href: row.href ?? undefined,
    actor: row.actor ?? undefined,
    relatedTo: row.relatedTo ?? undefined,
    priority: row.priority ?? undefined,
    status: row.status ?? undefined,
  }
}

export async function getNotifications(filter?: {
  unreadOnly?: boolean
}): Promise<{ items: NotificationItem[]; total: number; unreadCount: number }> {
  await delay()
  let items = getDb().notifications.map(asNotif)
  const unreadCount = items.filter((n) => !n.read).length
  if (filter?.unreadOnly) items = items.filter((n) => !n.read)
  return { items, total: items.length, unreadCount }
}

export async function markNotificationRead(id: number): Promise<void> {
  await delay(150)
  const row = getDb().notifications.find((n) => n.id === id)
  if (row) row.read = true
}

export async function markAllNotificationsRead(): Promise<void> {
  await delay(200)
  for (const n of getDb().notifications) n.read = true
}
