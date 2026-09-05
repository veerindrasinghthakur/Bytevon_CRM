import { z } from 'zod'

export const activityTypeSchema = z.enum([
  'Lead Created',
  'Lead Won',
  'Meeting Scheduled',
  'Email Sent',
  'Call',
  'Document Viewed',
  'System Alert',
  'Contract Renewed',
  'Proposal Sent',
])

export const salesActivitySchema = z.object({
  id: z.string(),
  type: activityTypeSchema,
  title: z.string(),
  body: z.string(),
  actor: z.string(),
  actorAvatar: z.string().optional(),
  time: z.string(),
  dateGroup: z.string(),
  linkLabel: z.string().optional(),
  linkHref: z.string().optional(),
  tag: z.string().optional(),
})

export type SalesActivitySchema = z.infer<typeof salesActivitySchema>

export const salesActivityListResponseSchema = z.object({
  items: z.array(salesActivitySchema),
  total: z.number(),
})
