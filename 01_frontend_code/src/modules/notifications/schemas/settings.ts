import { z } from 'zod'
import { deliveryChannelSchema } from './sent'

export const notificationTriggerSchema = z.object({
  id: z.string(),
  event: z.string(),
  description: z.string(),
  channels: z.array(deliveryChannelSchema),
  recipients: z.string(),
  lastTriggered: z.string(),
  enabled: z.boolean(),
})
export type NotificationTrigger = z.infer<typeof notificationTriggerSchema>

export const channelCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  enabled: z.boolean(),
})
export type ChannelCard = z.infer<typeof channelCardSchema>
