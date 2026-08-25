import { z } from 'zod'
import { taskPrioritySchema } from './task'

/** UI form state for create/edit task (string projectId for Select). */
export const taskFormSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  priority: taskPrioritySchema.default('MEDIUM'),
  projectId: z.string().optional().or(z.literal('')),
  assigneeName: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
})

export type TaskFormInput = z.infer<typeof taskFormSchema>
