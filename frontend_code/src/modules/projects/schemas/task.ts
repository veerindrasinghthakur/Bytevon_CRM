import { z } from 'zod'

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
export const taskStatusSchema = z.enum([
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED',
  'ON_HOLD',
])

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  projectId: z.number(),
  projectName: z.string().optional(),
  assigneeName: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  createdAt: z.string(),
})

export type TaskSchema = z.infer<typeof taskSchema>

export const taskListResponseSchema = z.object({
  items: z.array(taskSchema),
  total: z.number(),
})

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title is required').max(160),
  description: z.string().max(4000).optional().or(z.literal('')),
  priority: taskPrioritySchema.optional(),
  projectId: z.number().optional(),
  projectName: z.string().optional(),
  assigneeName: z.string().max(120).optional().or(z.literal('')),
})

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>

/** Re-export form schema from dedicated file */
export { taskFormSchema, type TaskFormInput } from './task-form'
