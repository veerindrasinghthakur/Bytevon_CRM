import { z } from 'zod'
import { taskPrioritySchema } from './task'

export const myTaskFormSchema = z.object({
  name: z.string().min(2, 'Title must be at least 2 characters').max(200),
  project: z.string().max(120).optional().or(z.literal('')),
  priority: taskPrioritySchema,
  dueDate: z.string().optional().or(z.literal('')),
  estimatedHours: z.string().max(20).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})
export type MyTaskFormValues = z.infer<typeof myTaskFormSchema>

export const emptyMyTaskForm = (): MyTaskFormValues => ({
  name: '',
  project: '',
  priority: 'Medium',
  dueDate: '',
  estimatedHours: '',
  description: '',
})
