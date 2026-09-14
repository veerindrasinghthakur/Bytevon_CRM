import { z } from 'zod'

/** UI form state for create/edit project (string teamId for Select). */
export const projectFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  code: z.string().max(32).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  clientName: z.string().max(120).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  repositoryUrl: z.string().optional().or(z.literal('')),
  teamId: z.string().optional().or(z.literal('')),
})

export type ProjectFormInput = z.infer<typeof projectFormSchema>

