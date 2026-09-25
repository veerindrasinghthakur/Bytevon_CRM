import { z } from 'zod'
import { notificationPrioritySchema } from './notification'

export const composeChannelsSchema = z.object({
  inApp: z.boolean(),
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
})

export const composeNotificationFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required').max(5000),
  priority: notificationPrioritySchema,
  moduleCtx: z.string().optional().default(''),
  broadcastAll: z.boolean().default(false),
  roles: z.array(z.string()).default([]),
  channels: composeChannelsSchema,
  scheduleMode: z.enum(['now', 'later']).default('now'),
  scheduleAt: z.string().optional(),
  attachmentNames: z.array(z.string()).optional(),
  attachment_ids: z.array(z.number()).optional(),
})

export type ComposeNotificationForm = z.infer<typeof composeNotificationFormSchema>

/** API payload (same shape; form uses strings for controlled inputs where needed) */
export const composeNotificationInputSchema = composeNotificationFormSchema
export type ComposeNotificationInput = z.infer<typeof composeNotificationInputSchema>

export const composeDeliveryResultSchema = z.object({
  queued: z.number(),
  sentRows: z.array(
    z.object({
      id: z.string(),
      recipientName: z.string(),
      recipientContact: z.string(),
      initials: z.string().optional(),
      title: z.string(),
      preview: z.string(),
      status: z.enum(['Delivered', 'Pending', 'Failed']),
      type: z.enum(['In-App', 'Email', 'SMS', 'Push']),
      sentAt: z.string(),
    }),
  ),
})
export type ComposeDeliveryResult = z.infer<typeof composeDeliveryResultSchema>

export function emptyComposeForm(): ComposeNotificationForm {
  return {
    title: '',
    body: '',
    priority: 'Normal',
    moduleCtx: '',
    broadcastAll: false,
    roles: [],
    channels: { inApp: true, email: false, sms: false, push: false },
    scheduleMode: 'now',
    scheduleAt: undefined,
    attachmentNames: [],
  }
}
