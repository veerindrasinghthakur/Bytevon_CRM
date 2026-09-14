import { z } from 'zod'
import { TaskPriority, TaskStatus } from '../../enums'

export const taskDetailFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(TaskPriority).default('MEDIUM'),
  status: z.enum(TaskStatus).default('TODO'),
  assigneeName: z.string().max(120).optional(),
  dueDate: z.string().optional(),
})

export type TaskDetailFormInput = z.infer<typeof taskDetailFormSchema>
