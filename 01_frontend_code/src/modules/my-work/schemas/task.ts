import { z } from 'zod'

export const taskPrioritySchema = z.enum(['Critical', 'High', 'Medium', 'Low'])
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export const taskStatusSchema = z.enum([
  'Not Started',
  'In Progress',
  'Blocked',
  'Completed',
  'Pending',
  'Cancelled',
])
export type TaskStatus = z.infer<typeof taskStatusSchema>

export const myTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  project: z.string().optional(),
  projectId: z.number().optional(),
  projectName: z.string().optional(),
  priority: taskPrioritySchema,
  dueDate: z.string(),
  status: taskStatusSchema,
  estimatedHours: z.string().optional(),
  assignee: z.string().optional(),
  createdAt: z.string().optional(),
})
export type MyTask = z.infer<typeof myTaskSchema>

export const createMyTaskSchema = z.object({
  name: z.string().min(2).max(200),
  project: z.string().max(120).optional(),
  priority: taskPrioritySchema,
  dueDate: z.string().optional(),
  estimatedHours: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
})
export type CreateMyTaskInput = z.infer<typeof createMyTaskSchema>
