import { z } from 'zod'
import { sentNotificationRowSchema } from './sent'

export const sentListResponseSchema = z.object({
  items: z.array(sentNotificationRowSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type SentListResponse = z.infer<typeof sentListResponseSchema>
