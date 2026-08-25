import { z } from 'zod'

export const auditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  actor: z.string(),
  actorInitials: z.string(),
  target: z.string(),
  module: z.string(),
  timestamp: z.string(),
  ip: z.string(),
})

export type AuditLogSchema = z.infer<typeof auditLogSchema>

export const securityEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  identity: z.string(),
  source: z.string(),
  timestamp: z.string(),
  status: z.enum(['Success', 'Blocked', 'Warning']),
})

export type SecurityEventSchema = z.infer<typeof securityEventSchema>

export const recordAuditInputSchema = z.object({
  action: z.string().min(1),
  target: z.string().min(1),
  module: z.string().min(1),
  actor: z.string().optional(),
  actorInitials: z.string().optional(),
  ip: z.string().optional(),
})

export type RecordAuditInputSchema = z.infer<typeof recordAuditInputSchema>
