import { z } from 'zod'
import { caseStudyStatusSchema } from './case-study'

/** UI form state for case study (tags as comma-separated string). */
export const caseStudyFormSchema = z.object({
  title: z.string().min(2, 'Title is required').max(160),
  customer: z.string().min(1, 'Customer is required').max(120),
  industry: z.string().min(1, 'Industry is required').max(80),
  status: caseStudyStatusSchema,
  impact: z.string().max(200).optional().or(z.literal('')),
  revenue: z.string().max(40).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  summary: z.string().max(4000).optional().or(z.literal('')),
})

export type CaseStudyFormInput = z.infer<typeof caseStudyFormSchema>
