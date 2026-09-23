import { describe, expect, it } from 'vitest'
import {
  computeInboxKpis,
  listInboxNotifications,
  markAllNotificationsRead,
} from '@/modules/notifications/api/center'
import { computeSentKpis, listSentNotifications } from '@/modules/notifications/api/sent'
import { listTemplates } from '@/modules/notifications/api/template'
import { listPreferences } from '@/modules/notifications/api/preference'
import type { AppNotification } from '@/modules/notifications/types'

function n(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: '1',
    title: 'Hello',
    body: 'World',
    status: 'Unread',
    priority: 'Normal',
    timeAgo: '2h ago',
    ...over,
  } as AppNotification
}

describe('computeInboxKpis', () => {
  it('counts unread/high/pending/archived/today', () => {
    const kpis = computeInboxKpis([
      n({ status: 'Unread', priority: 'High' }),
      n({ id: '2', status: 'Read', priority: 'Low', timeAgo: 'Yesterday' }),
      n({ id: '3', status: 'Archived', priority: 'Normal', timeAgo: 'Today' }),
    ])
    const byId = Object.fromEntries(kpis.map((k) => [k.id, k.value]))
    expect(byId.unread).toBe('1')
    expect(byId.archived).toBe('1')
  })
  it('is empty-safe', () => {
    expect(computeInboxKpis([]).find((k) => k.id === 'unread')?.value).toBe('0')
  })
})

describe('computeSentKpis', () => {
  it('aggregates sent rows without crashing on empty', () => {
    expect(() => computeSentKpis([])).not.toThrow()
  })
})

describe('notifications mock API', () => {
  it('lists inbox, sent, templates and preferences', async () => {
    const inbox = await listInboxNotifications()
    expect(Array.isArray(inbox.items)).toBe(true)
    expect(inbox.total).toBe(inbox.items.length)
    const sent = await listSentNotifications()
    expect(Array.isArray(sent.items ?? sent)).toBe(true)
    expect(Array.isArray(await listTemplates())).toBe(true)
    expect(Array.isArray(await listPreferences())).toBe(true)
  })
  it('markAllNotificationsRead resolves', async () => {
    await expect(markAllNotificationsRead()).resolves.toBeUndefined()
  })
})
