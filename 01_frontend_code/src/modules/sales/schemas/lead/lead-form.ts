import { z } from 'zod'
import { leadPrioritySchema, pipelineStageSchema, recordStatusSchema } from '../enums'

/**
 * UI form for /sales/leads/new.
 * Maps to backend LeadCreate (title → lead_title, platformId → platform_id, etc.).
 */
export const leadFormSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactTitle: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  /** platforms.id as string for Select; empty = none */
  platformId: z.string().optional().or(z.literal('')),
  priority: leadPrioritySchema,
  status: recordStatusSchema,
  stage: pipelineStageSchema,
  budget: z.string().optional().or(z.literal('')),
  date: z.string().optional().or(z.literal('')),
  assignedEmploymentId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  chatLink: z.string().optional().or(z.literal('')),
  autoCreateProject: z.boolean().optional().default(false),
})

export type LeadFormSchemaInput = z.infer<typeof leadFormSchema>
export type LeadForm = LeadFormSchemaInput

export const emptyLeadForm = (): LeadForm => ({
  title: '',
  contactName: '',
  contactTitle: '',
  company: '',
  industry: '',
  email: '',
  phone: '',
  platformId: '',
  priority: 'Medium',
  status: 'Active',
  stage: 'New',
  budget: '',
  date: '',
  assignedEmploymentId: '',
  notes: '',
  chatLink: '',
  autoCreateProject: false,
})

export function optTrim(value: string | undefined | null): string | undefined {
  const trimmed = (value ?? '').trim()
  return trimmed || undefined
}
