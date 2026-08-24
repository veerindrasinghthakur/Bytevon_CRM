/**
 * Notifications API — admin pattern: env.useMockApi branch, mock store mutable for mark-read/archive/send.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import {
  inboxNotifications as seedInbox,
  sentNotifications as seedSent,
  notificationTriggers as seedTriggers,
  channelCards as seedChannels,
} from '../data/mock'
import type {
  AppNotification,
  ChannelCard,
  ComposeDeliveryResult,
  ComposeNotificationInput,
  NotificationKpi,
  NotificationStatus,
  NotificationTrigger,
  SentKpi,
  SentNotificationRow,
} from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

let inboxStore: AppNotification[] | null = null
let sentStore: SentNotificationRow[] | null = null

function getInbox(): AppNotification[] {
  if (!inboxStore) inboxStore = seedInbox.map((n) => ({ ...n, meta: n.meta?.map((m) => ({ ...m })), timeline: n.timeline?.map((t) => ({ ...t })), tags: n.tags ? [...n.tags] : undefined }))
  return inboxStore
}

function getSent(): SentNotificationRow[] {
  if (!sentStore) sentStore = seedSent.map((r) => ({ ...r }))
  return sentStore
}

export function computeInboxKpis(items: AppNotification[]): NotificationKpi[] {
  const unread = items.filter((n) => n.status === 'Unread').length
  const high = items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length
  const pending = items.filter((n) => n.status === 'Unread' && (n.priority === 'High' || n.priority === 'Critical' || (n.tags ?? []).includes('Pending'))).length
  const archived = items.filter((n) => n.status === 'Archived').length
  const today = items.filter((n) => n.timeAgo.includes('m ago') || n.timeAgo.includes('h ago') || n.timeAgo === 'Today').length
  return [
    { id: 'unread', label: 'Unread', value: String(unread), hint: unread ? 'Needs attention' : 'Inbox clear', hintTone: unread ? 'danger' : 'positive', icon: 'mark_email_unread' },
    { id: 'high', label: 'High Priority', value: String(high), hint: high ? 'Requires immediate action' : 'None', hintTone: high ? 'danger' : 'neutral', icon: 'warning' },
    { id: 'pending', label: 'Pending Actions', value: String(pending), hint: 'Awaiting your response', hintTone: 'neutral', icon: 'pending_actions' },
    { id: 'archived', label: 'Archived', value: String(archived), hint: 'In this list', hintTone: 'neutral', icon: 'inventory_2' },
    { id: 'today', label: 'Today', value: String(today || items.length), hint: 'Recent activity', hintTone: 'positive', icon: 'today' },
  ]
}

export function computeSentKpis(rows: SentNotificationRow[]): SentKpi[] {
  const total = rows.length
  const delivered = rows.filter((r) => r.status === 'Delivered').length
  const failed = rows.filter((r) => r.status === 'Failed').length
  const rate = total ? ((delivered / total) * 100).toFixed(1) : '0'
  return [
    { id: 'total', label: 'Total Sent', value: String(total), hint: 'In current log', icon: 'send' },
    { id: 'delivery', label: 'Delivery Rate', value: `${rate}%`, hint: '', icon: 'check_circle' },
    { id: 'open', label: 'Delivered', value: String(delivered), hint: 'Successfully received', icon: 'visibility' },
    { id: 'failed', label: 'Failed Delivery', value: String(failed), hint: failed ? 'Requires Attention' : 'None', icon: 'error', danger: failed > 0 },
  ]
}

export async function listInboxNotifications(): Promise<AppNotification[]> {
  if (env.useMockApi) {
    await delay()
    return getInbox().map((n) => ({ ...n }))
  }
  const { data } = await apiClient.get<AppNotification[]>('/notifications/inbox')
  return data
}

export async function getNotification(id?: string | number): Promise<AppNotification | null> {
  if (env.useMockApi) {
    await delay()
    return getInbox().find((n) => n.id === id) ?? null
  }
  const { data } = await apiClient.get<AppNotification>(`/notifications/${id}`)
  return data
}

export async function markNotificationRead(id: string): Promise<void> {
  if (env.useMockApi) {
    await delay(120)
    const row = getInbox().find((n) => n.id === id)
    if (row && row.status === 'Unread') row.status = 'Read'
    return
  }
  await apiClient.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  if (env.useMockApi) {
    await delay(150)
    for (const n of getInbox()) {
      if (n.status !== 'Archived') n.status = 'Read'
    }
    return
  }
  await apiClient.post('/notifications/read-all')
}

export async function archiveNotification(id: string): Promise<void> {
  if (env.useMockApi) {
    await delay(120)
    const row = getInbox().find((n) => n.id === id)
    if (row) row.status = 'Archived'
    return
  }
  await apiClient.post(`/notifications/${id}/archive`)
}

export async function archiveReadNotifications(): Promise<void> {
  if (env.useMockApi) {
    await delay(150)
    for (const n of getInbox()) {
      if (n.status === 'Read') n.status = 'Archived'
    }
    return
  }
  await apiClient.post('/notifications/archive-read')
}

export async function setNotificationStatus(id: string, status: NotificationStatus): Promise<void> {
  if (env.useMockApi) {
    await delay(100)
    const row = getInbox().find((n) => n.id === id)
    if (row) row.status = status
    return
  }
  await apiClient.patch(`/notifications/${id}`, { status })
}

export async function listSentNotifications(): Promise<SentNotificationRow[]> {
  if (env.useMockApi) {
    await delay()
    return getSent().map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<SentNotificationRow[]>('/notifications/sent')
  return data
}

export async function listNotificationTriggers(): Promise<NotificationTrigger[]> {
  if (env.useMockApi) {
    await delay()
    return seedTriggers.map((t) => ({ ...t, channels: [...t.channels] }))
  }
  const { data } = await apiClient.get<NotificationTrigger[]>('/notifications/triggers')
  return data
}

export async function listChannelCards(): Promise<ChannelCard[]> {
  if (env.useMockApi) {
    await delay()
    return seedChannels.map((c) => ({ ...c }))
  }
  const { data } = await apiClient.get<ChannelCard[]>('/notifications/channels')
  return data
}

/** Mock employee directory for targeted send */
const MOCK_EMPLOYEES = [
  { name: 'Elena Rodriguez', contact: 'e.rodriguez@bytevon.com', initials: 'ER' },
  { name: 'Marcus Webb', contact: 'm.webb@bytevon.com', initials: 'MW' },
  { name: 'Julian Chen', contact: 'j.chen@bytevon.com', initials: 'JC' },
  { name: 'Sarah Lowndes', contact: 's.lowndes@bytevon.com', initials: 'SL' },
  { name: 'Alex Rivera', contact: 'a.rivera@bytevon.com', initials: 'AR' },
]


export async function sendNotification(input: ComposeNotificationInput): Promise<ComposeDeliveryResult> {
  if (env.useMockApi) {
    await delay(400)
    const recipients = input.broadcastAll
      ? MOCK_EMPLOYEES
      : MOCK_EMPLOYEES.filter((_, i) => input.roles.length === 0 || i < Math.max(1, input.roles.length))
    const channel: SentNotificationRow['type'] = input.channels.email
      ? 'Email'
      : input.channels.inApp
        ? 'In-App'
        : input.channels.push
          ? 'Push'
          : 'Email'
    const now = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const sentRows: SentNotificationRow[] = recipients.map((r, i) => ({
      id: `s-${Date.now()}-${i}`,
      recipientName: r.name,
      recipientContact: r.contact,
      initials: r.initials,
      title: input.title,
      preview: input.body.slice(0, 80) + (input.body.length > 80 ? '…' : ''),
      status: 'Delivered',
      type: channel,
      sentAt: now,
    }))
    getSent().unshift(...sentRows)
    return { queued: sentRows.length, sentRows }
  }
  const { data } = await apiClient.post<ComposeDeliveryResult>('/notifications/compose', input)
  return data
}

export async function saveNotificationDraft(input: ComposeNotificationInput): Promise<void> {
  if (env.useMockApi) {
    await delay(200)
    try {
      localStorage.setItem('bytevon.notifDraft', JSON.stringify(input))
    } catch {
      /* ignore */
    }
    return
  }
  await apiClient.post('/notifications/drafts', input)
}
