import { z } from 'zod'

export const batchFrequencySchema = z.enum(['immediate', 'hourly', 'daily'])
export type BatchFrequency = z.infer<typeof batchFrequencySchema>

/** Local edit form for notification settings (MODULE_STANDARDS §3.3 / §10) */
export const notificationSettingsFormSchema = z.object({
  channelEnabled: z.record(z.string(), z.boolean()),
  triggerEnabled: z.record(z.string(), z.boolean()),
  freq: batchFrequencySchema,
  quietOn: z.boolean(),
  quietStart: z.string().min(1),
  quietEnd: z.string().min(1),
})
export type NotificationSettingsForm = z.infer<typeof notificationSettingsFormSchema>

export function emptyNotificationSettingsForm(): NotificationSettingsForm {
  return {
    channelEnabled: {},
    triggerEnabled: {},
    freq: 'hourly',
    quietOn: true,
    quietStart: '21:00',
    quietEnd: '07:00',
  }
}
