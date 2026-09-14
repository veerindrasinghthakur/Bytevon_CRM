import { z } from 'zod'

export const projectDetailFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(2000).optional(),
  clientName: z.string().max(120).optional(),
  // Backend may store git path without scheme — do not require strict URL
  repositoryUrl: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type ProjectDetailFormInput = z.infer<typeof projectDetailFormSchema>

