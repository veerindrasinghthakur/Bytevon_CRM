import { z } from 'zod'

export const notificationPrioritySchema = z.enum(['Low', 'Normal', 'High', 'Critical'])
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>

export const notificationStatusSchema = z.enum(['Unread', 'Read', 'Archived'])
export type NotificationStatus = z.infer<typeof notificationStatusSchema>

export const notificationTabIdSchema = z.enum(['all', 'unread', 'mentions', 'high', 'archived'])
export type NotificationTabId = z.infer<typeof notificationTabIdSchema>

export const notificationMetaSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const notificationTimelineSchema = z.object({
  title: z.string(),
  time: z.string(),
  detail: z.string(),
  active: z.boolean().optional(),
})

export const appNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  module: z.string(),
  priority: notificationPrioritySchema,
  status: notificationStatusSchema,
  timeAgo: z.string(),
  createdAt: z.string(),
  icon: z.string(),
  tags: z.array(z.string()).optional(),
  actor: z.string().optional(),
  employeeId: z.string().optional(),
  relatedHref: z.string().optional(),
  note: z.string().optional(),
  meta: z.array(notificationMetaSchema).optional(),
  timeline: z.array(notificationTimelineSchema).optional(),
})
export type AppNotification = z.infer<typeof appNotificationSchema>

export const notificationKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  hint: z.string(),
  hintTone: z.enum(['positive', 'danger', 'neutral']),
  icon: z.string(),
})
export type NotificationKpi = z.infer<typeof notificationKpiSchema>

export const notificationTabSchema = z.object({
  id: notificationTabIdSchema,
  label: z.string(),
})
export type NotificationTab = z.infer<typeof notificationTabSchema>

/** Re-export list response from dedicated file (MODULE_STANDARDS §3.1) */
export {
  notificationListResponseSchema,
  type NotificationListResponse,
} from './notification-list-response'
