import { z } from 'zod'

export const deliveryChannelSchema = z.enum(['In-App', 'Email', 'SMS', 'Push'])
export type DeliveryChannel = z.infer<typeof deliveryChannelSchema>

export const deliveryStatusSchema = z.enum(['Delivered', 'Pending', 'Failed'])
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>

export const sentNotificationRowSchema = z.object({
  id: z.string(),
  recipientName: z.string(),
  recipientContact: z.string(),
  initials: z.string().optional(),
  title: z.string(),
  preview: z.string(),
  status: deliveryStatusSchema,
  type: deliveryChannelSchema,
  sentAt: z.string(),
})
export type SentNotificationRow = z.infer<typeof sentNotificationRowSchema>

export const sentListResponseSchema = z.object({
  items: z.array(sentNotificationRowSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type SentListResponse = z.infer<typeof sentListResponseSchema>

export const sentKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  hint: z.string(),
  icon: z.string(),
  danger: z.boolean().optional(),
})
export type SentKpi = z.infer<typeof sentKpiSchema>
