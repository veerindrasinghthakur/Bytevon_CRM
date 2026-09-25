/**
 * Notifications — center (inbox) domain API.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import { inboxNotifications as seedInbox } from '@/shared/mock/data/notifications'
import type {
  AppNotification,
  NotificationKpi,
  NotificationListResponse,
  NotificationStatus,
  InboxListParams,
} from '../types'

let inboxStore: AppNotification[] | null = null

function getInbox(): AppNotification[] {
  if (!inboxStore) {
    inboxStore = seedInbox.map((n) => ({
      ...n,
      meta: n.meta?.map((m) => ({ ...m })),
      timeline: n.timeline?.map((t) => ({ ...t })),
      tags: n.tags ? [...n.tags] : undefined,
    }))
  }
  return inboxStore
}

function isMention(n: AppNotification): boolean {
  return (
    (n.body ?? '').toLowerCase().includes('@') ||
    (n.title ?? '').toLowerCase().includes('mention') ||
    (n.tags ?? []).some((t) => t.toLowerCase().includes('mention'))
  )
}

/** Backend status (UNREAD|READ|ARCHIVED) -> UI status (Unread|Read|Archived). */
function toUiStatus(s: unknown): AppNotification['status'] {
  const v = String(s ?? 'Unread').toUpperCase()
  if (v === 'READ') return 'Read'
  if (v === 'ARCHIVED') return 'Archived'
  return 'Unread'
}

function timeAgoFrom(dateStr: unknown): string {
  if (!dateStr) return '—'
  const then = new Date(String(dateStr)).getTime()
  if (Number.isNaN(then)) return '—'
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(then).toLocaleDateString()
}

/**
 * Backend NotificationResponse (flat, UPPERCASE status, no timeAgo/priority/
 * module) -> AppNotification UI shape. Mock-shaped rows pass through.
 */
export function normalizeInboxRow(raw: Record<string, unknown>): AppNotification {
  if (raw.timeAgo != null && raw.module != null && raw.priority != null) {
    return {
      ...(raw as unknown as AppNotification),
      status: toUiStatus((raw as { status: unknown }).status),
    }
  }
  const title = String(raw.title ?? '')
  const lower = `${title} ${(raw as { body?: unknown }).body ?? ''}`.toLowerCase()
  const module =
    /leave|attendance|approval|request|payroll/.test(lower)
      ? 'Approvals'
      : /welcome|system|security/.test(lower)
        ? 'System'
        : 'System'
  const channel = String(raw.channel ?? 'IN_APP').toUpperCase()
  return {
    id: String(raw.id ?? ''),
    title,
    body: String((raw as { body?: unknown }).body ?? ''),
    module,
    priority: 'Normal',
    status: toUiStatus(raw.status),
    timeAgo: timeAgoFrom(raw.created_at ?? raw.createdAt),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    icon: channel === 'EMAIL' ? 'mail' : 'notifications',
    tags: [],
    actor: undefined,
    employeeId: undefined,
    relatedHref: undefined,
    note: undefined,
    meta: [],
    timeline: [],
  }
}

export function computeInboxKpis(items: AppNotification[]): NotificationKpi[] {
  const unread = items.filter((n) => n.status === 'Unread').length
  const high = items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length
  const pending = items.filter(
    (n) =>
      n.status === 'Unread' &&
      (n.priority === 'High' || n.priority === 'Critical' || (n.tags ?? []).includes('Pending')),
  ).length
  const archived = items.filter((n) => n.status === 'Archived').length
  const today = items.filter((n) => {
    const ago = n.timeAgo ?? ''
    return ago.includes('m ago') || ago.includes('h ago') || ago === 'Today' || ago === 'Just now' || ago === 'Yesterday'
  }).length
  return [
    {
      id: 'unread',
      label: 'Unread',
      value: String(unread),
      hint: unread ? 'Needs attention' : 'Inbox clear',
      hintTone: unread ? 'danger' : 'positive',
      icon: 'mark_email_unread',
    },
    {
      id: 'high',
      label: 'High Priority',
      value: String(high),
      hint: high ? 'Requires immediate action' : 'None',
      hintTone: high ? 'danger' : 'neutral',
      icon: 'warning',
    },
    {
      id: 'pending',
      label: 'Pending Actions',
      value: String(pending),
      hint: 'Awaiting your response',
      hintTone: 'neutral',
      icon: 'pending_actions',
    },
    {
      id: 'archived',
      label: 'Archived',
      value: String(archived),
      hint: 'In this list',
      hintTone: 'neutral',
      icon: 'inventory_2',
    },
    {
      id: 'today',
      label: 'Today',
      value: String(today || items.length),
      hint: 'Recent activity',
      hintTone: 'positive',
      icon: 'today',
    },
  ]
}

function filterInbox(items: AppNotification[], params: InboxListParams): AppNotification[] {
  const {
    search,
    tab = 'all',
    typeFilter = 'All',
    priorityFilter = 'All',
    moduleFilter = 'All',
  } = params

  return items.filter((n) => {
    if (tab === 'unread' && n.status !== 'Unread') return false
    if (tab === 'high' && n.priority !== 'High' && n.priority !== 'Critical') return false
    if (tab === 'archived' && n.status !== 'Archived') return false
    if (tab === 'mentions' && !isMention(n)) return false
    if (priorityFilter === 'High' && n.priority !== 'High' && n.priority !== 'Critical') return false
    if (priorityFilter === 'Medium' && n.priority !== 'Normal') return false
    if (priorityFilter === 'Low' && n.priority !== 'Low') return false
    if (moduleFilter !== 'All' && n.module !== moduleFilter) return false
    if (typeFilter === 'System' && n.module !== 'System') return false
    if (
      typeFilter === 'Approval' &&
      !(n.title ?? '').toLowerCase().includes('leave') &&
      !(n.title ?? '').toLowerCase().includes('request')
    )
      return false
    if (typeFilter === 'Mention' && !isMention(n)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (n.title ?? '').toLowerCase().includes(q) ||
        (n.body ?? '').toLowerCase().includes(q) ||
        (n.module ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })
}

export async function listInboxNotifications(
  params: InboxListParams = {},
): Promise<NotificationListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50

  if (!env.useMockApi) {
    const { data } = await apiClient.get<unknown>('/notifications/inbox', {
      params: { page, pageSize, ...params },
    })
    // Live returns a bare array; normalize every row to the UI shape.
    const rows = Array.isArray(data)
      ? data
      : ((data as { items?: unknown[] }).items ?? [])
    const items = (rows as Record<string, unknown>[]).map(normalizeInboxRow)
    const total =
      (data as { total?: number }).total ?? items.length
    const filtered = filterInbox(items, params)
    const { items: pageItems } = paginateItems(filtered, page, pageSize)
    return {
      items: pageItems,
      total: filtered.length,
      page,
      pageSize,
      unreadCount: items.filter((n) => n.status === 'Unread').length,
      highCount: items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length,
      mentionCount: items.filter(isMention).length,
      archivedCount: items.filter((n) => n.status === 'Archived').length,
    }
  }

  await delay(200)
  const all = getInbox()
  const filtered = filterInbox(all, params)
  const { items, total } = paginateItems(filtered, page, pageSize)

  return {
    items: items.map((n) => ({ ...n })),
    total,
    page,
    pageSize,
    unreadCount: all.filter((n) => n.status === 'Unread').length,
    highCount: all.filter((n) => n.priority === 'High' || n.priority === 'Critical').length,
    mentionCount: all.filter(isMention).length,
    archivedCount: all.filter((n) => n.status === 'Archived').length,
  }
}

export async function listAllInboxNotifications(): Promise<AppNotification[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<unknown>('/notifications/inbox/all')
    const rows = Array.isArray(data) ? data : []
    return (rows as Record<string, unknown>[]).map(normalizeInboxRow)
  }
  await delay(100)
  return getInbox().map((n) => ({ ...n }))
}

export async function getNotification(id?: string | number): Promise<AppNotification | null> {
  if (env.useMockApi) {
    await delay(150)
    return getInbox().find((n) => n.id === String(id)) ?? null
  }
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`/notifications/${id}`)
    return normalizeInboxRow(data ?? {})
  } catch {
    return null
  }
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

export async function unreadNotificationsCount(): Promise<number> {
  if (env.useMockApi) {
    await delay(100)
    return getInbox().filter((n) => n.status === 'Unread').length
  }
  const { data } = await apiClient.get<{ unread: number }>('/notifications/inbox/unread-count')
  return data.unread ?? 0
}

export async function deleteNotification(id: string): Promise<void> {
  if (env.useMockApi) {
    await delay(120)
    const store = getInbox()
    const idx = store.findIndex((n) => n.id === id)
    if (idx >= 0) store.splice(idx, 1)
    return
  }
  await apiClient.delete(`/notifications/${id}`)
}

