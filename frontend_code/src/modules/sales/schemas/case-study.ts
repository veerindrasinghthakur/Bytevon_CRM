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

/** Re-export form schema from dedicated file */
export { caseStudyFormSchema, type CaseStudyFormInput } from './case-study-form'
