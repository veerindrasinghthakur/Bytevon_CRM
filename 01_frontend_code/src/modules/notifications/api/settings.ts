/**
 * Notifications — settings / preference domain API (channels + triggers).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import {
  notificationTriggers as seedTriggers,
  channelCards as seedChannels,
} from '@/shared/mock/data/notifications'
import type { ChannelCard, NotificationTrigger } from '../types'

export async function listNotificationTriggers(): Promise<NotificationTrigger[]> {
  if (env.useMockApi) {
    await delay(150)
    return seedTriggers.map((t) => ({ ...t, channels: [...t.channels] }))
  }
  const { data } = await apiClient.get<NotificationTrigger[]>('/notifications/triggers')
  return data
}

export async function listChannelCards(): Promise<ChannelCard[]> {
  if (env.useMockApi) {
    await delay(150)
    return seedChannels.map((c) => ({ ...c }))
  }
  const { data } = await apiClient.get<ChannelCard[]>('/notifications/channels')
  return data
}
