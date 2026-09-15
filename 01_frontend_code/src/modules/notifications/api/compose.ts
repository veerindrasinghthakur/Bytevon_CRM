/**
 * Notifications — compose domain API.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { mockNotificationEmployees } from '@/shared/mock/data/notifications'
import type { ComposeDeliveryResult, ComposeNotificationInput, SentNotificationRow } from '../types'
import { _prependSentRows } from './sent'

export async function sendNotification(input: ComposeNotificationInput): Promise<ComposeDeliveryResult> {
  if (env.useMockApi) {
    await delay(400)
    const recipients = input.broadcastAll
      ? mockNotificationEmployees
      : mockNotificationEmployees.filter((_, i) => input.roles.length === 0 || i < Math.max(1, input.roles.length))
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
    _prependSentRows(sentRows)
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
