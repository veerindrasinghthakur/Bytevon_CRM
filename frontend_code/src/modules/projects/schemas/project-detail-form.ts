import { z } from 'zod'

export const projectDetailFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(2000).optional(),
  clientName: z.string().max(120).optional(),
  repositoryUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type ProjectDetailFormInput = z.infer<typeof projectDetailFormSchema>