import { z } from 'zod'
import { recordStatusSchema } from './lead'

export const clientTypeSchema = z.enum(['Enterprise', 'SMB', 'Partner'])

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string().optional(),
  type: clientTypeSchema,
  status: recordStatusSchema,
  industry: z.string(),
  sector: z.string().optional(),
  website: z.string().optional(),
  country: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  primaryContact: z.string().optional(),
  projects: z.number(),
  leads: z.number(),
  revenue: z.number().optional(),
  arr: z.number().optional(),
  growth: z.string().optional(),
  taxId: z.string().optional(),
  founded: z.string().optional(),
  address: z.string().optional(),
  clientSince: z.string().optional(),
  logoInitials: z.string().optional(),
  tags: z.array(z.string()).optional(),
  chatLink: z.string().optional(),
})

export type ClientSchema = z.infer<typeof clientSchema>

export const clientListResponseSchema = z.object({
  items: z.array(clientSchema),
  total: z.number(),
})

export const clientContactFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  designation: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
})

export const createClientSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  legalName: z.string().max(160).optional().or(z.literal('')),
  type: clientTypeSchema.optional(),
  status: recordStatusSchema.optional(),
  industry: z.string().max(80).optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  country: z.string().max(80).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  taxId: z.string().max(40).optional().or(z.literal('')),
  founded: z.string().optional().or(z.literal('')),
  chatLink: z.string().url().optional().or(z.literal('')),
  primaryContact: z.string().max(120).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
})

export type CreateClientSchemaInput = z.infer<typeof createClientSchema>

/** Re-export form schema from dedicated file */
export { clientFormSchema, type ClientFormSchemaInput } from './client-form'
