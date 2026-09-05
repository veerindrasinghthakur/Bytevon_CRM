import { z } from 'zod'

export const assignProjectSchema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  role: z.string().min(1),
  notes: z.string().optional().or(z.literal('')),
})

export type AssignProjectForm = z.infer<typeof assignProjectSchema>
