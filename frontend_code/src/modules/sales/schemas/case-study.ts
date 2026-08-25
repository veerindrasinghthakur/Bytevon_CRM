import { z } from 'zod'

export const caseStudyStatusSchema = z.enum(['Published', 'Draft', 'Archived'])

export const caseStudySchema = z.object({
  id: z.string(),
  title: z.string(),
  customer: z.string(),
  industry: z.string(),
  status: caseStudyStatusSchema,
  impact: z.string(),
  revenue: z.string(),
  tags: z.array(z.string()),
  imageUrl: z.string().optional(),
  summary: z.string().optional(),
  technologies: z.array(z.string()).optional(),
})

export type CaseStudySchema = z.infer<typeof caseStudySchema>

export const caseStudyFormSchema = z.object({
  title: z.string().min(2, 'Title is required').max(160),
  customer: z.string().min(1, 'Customer is required').max(120),
  industry: z.string().min(1, 'Industry is required').max(80),
  status: caseStudyStatusSchema,
  impact: z.string().max(200).optional().or(z.literal('')),
  revenue: z.string().max(40).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')), // comma-separated in UI
  summary: z.string().max(4000).optional().or(z.literal('')),
})

export type CaseStudyFormInput = z.infer<typeof caseStudyFormSchema>
