import { z } from 'zod'
import { appNotificationSchema } from './notification'

export const notificationListResponseSchema = z.object({
  items: z.array(appNotificationSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  /** Counts on full set (for tabs / KPIs) */
  unreadCount: z.number().optional(),
  highCount: z.number().optional(),
  mentionCount: z.number().optional(),
  archivedCount: z.number().optional(),
})
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>
