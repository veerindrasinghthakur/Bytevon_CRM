import { z } from 'zod'

export const recordStatusSchema = z.enum(['Active', 'Inactive'])
export const pipelineStageSchema = z.enum([
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
])
export const leadPrioritySchema = z.enum(['Critical', 'High', 'Medium', 'Low'])

export const leadSchema = z.object({
  id: z.string(),
  title: z.string(),
  contactName: z.string(),
  contactTitle: z.string().optional(),
  company: z.string(),
  industry: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z.string(),
  priority: leadPrioritySchema,
  status: recordStatusSchema,
  stage: pipelineStageSchema,
  budget: z.number(),
  probability: z.number().optional(),
  date: z.string().optional(),
  assignedTo: z.string().optional(),
  assignedAvatar: z.string().optional(),
  platform: z.string().optional(),
  tags: z.array(z.string()).optional(),
  caseStudy: z.string().optional(),
  createdAt: z.string(),
  notes: z.string().optional(),
  chatLink: z.string().optional(),
})

export type LeadSchema = z.infer<typeof leadSchema>

export const leadListResponseSchema = z.object({
  items: z.array(leadSchema),
  total: z.number(),
})

export const createLeadSchema = z.object({
  title: z.string().min(2, 'Title is required').max(160),
  company: z.string().min(1, 'Company is required').max(120),
  contactName: z.string().min(1, 'Contact name is required').max(120),
  contactTitle: z.string().max(80).optional().or(z.literal('')),
  industry: z.string().max(80).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  source: z.string().optional(),
  priority: leadPrioritySchema.optional(),
  status: recordStatusSchema.optional(),
  stage: pipelineStageSchema.optional(),
  budget: z.coerce.number().nonnegative().optional(),
  date: z.string().optional().or(z.literal('')),
  assignedTo: z.string().optional().or(z.literal('')),
  assignedEmploymentId: z.number().nullable().optional(),
  notes: z.string().max(4000).optional().or(z.literal('')),
  chatLink: z.string().url().optional().or(z.literal('')),
})

export type CreateLeadSchemaInput = z.infer<typeof createLeadSchema>

/** Re-export form schema from dedicated file */
export { leadFormSchema, type LeadFormSchemaInput } from './lead-form'
