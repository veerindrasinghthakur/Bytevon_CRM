import { z } from 'zod'

/** UI form state for create/edit team (string projectId for Select). */
export const teamFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
  headName: z.string().optional().or(z.literal('')),
  headRole: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  projectId: z.string().optional().or(z.literal('')),
})

export type TeamFormInput = z.infer<typeof teamFormSchema>
