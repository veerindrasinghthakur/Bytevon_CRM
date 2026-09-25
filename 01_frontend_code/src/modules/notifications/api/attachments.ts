/**
 * Notification attachments — real Minio upload + link records.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'

export interface NotificationAttachment {
  id: number
  notification_id: number | null
  file_reference: string
  file_name: string
  mime_type: string
  file_size: number
  uploaded_by: number | null
  created_at: string
}

export async function uploadAttachment(file: File): Promise<NotificationAttachment> {
  if (env.useMockApi) {
    await delay(250)
    return {
      id: Date.now(),
      notification_id: null,
      file_reference: `mock://${file.name}`,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      uploaded_by: null,
      created_at: new Date().toISOString(),
    }
  }
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<NotificationAttachment>(
    '/notifications/attachments',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function listNotificationAttachments(
  notificationId: string | number,
): Promise<NotificationAttachment[]> {
  if (env.useMockApi) return []
  const { data } = await apiClient.get<NotificationAttachment[]>(
    `/notifications/${notificationId}/attachments`,
  )
  return data
}
