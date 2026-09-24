/**
 * Notifications — preference domain (GET/PUT /notifications/preferences, per-channel).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'

export type PreferenceChannel = 'IN_APP' | 'EMAIL'

export type NotificationPreference = {
  channel: PreferenceChannel
  is_enabled: boolean
  updated_at?: string | null
}

let mockPrefs: NotificationPreference[] = [
  { channel: 'IN_APP', is_enabled: true },
  { channel: 'EMAIL', is_enabled: true },
]

export async function listPreferences(): Promise<NotificationPreference[]> {
  if (env.useMockApi) {
    await delay(150)
    return mockPrefs.map((p) => ({ ...p }))
  }
  const { data } = await apiClient.get<unknown>('/notifications/preferences')
  const rows = Array.isArray(data) ? data : []
  return (rows as Record<string, unknown>[]).map((r) => ({
    channel: String(r.channel ?? 'IN_APP') as PreferenceChannel,
    is_enabled: Boolean(r.is_enabled ?? true),
    updated_at: (r.updated_at as string | null) ?? null,
  }))
}

export async function setPreference(input: {
  channel: PreferenceChannel
  is_enabled: boolean
}): Promise<NotificationPreference> {
  if (env.useMockApi) {
    await delay(250)
    const idx = mockPrefs.findIndex((p) => p.channel === input.channel)
    if (idx < 0) {
      const row = { ...input }
      mockPrefs = [...mockPrefs, row]
      return row
    }
    mockPrefs[idx] = { ...mockPrefs[idx], is_enabled: input.is_enabled }
    return mockPrefs[idx]
  }
  const { data } = await apiClient.put<Record<string, unknown>>('/notifications/preferences', {
    channel: input.channel,
    is_enabled: input.is_enabled,
  })
  return {
    channel: String(data.channel ?? input.channel) as PreferenceChannel,
    is_enabled: Boolean(data.is_enabled ?? input.is_enabled),
    updated_at: (data.updated_at as string | null) ?? null,
  }
}
