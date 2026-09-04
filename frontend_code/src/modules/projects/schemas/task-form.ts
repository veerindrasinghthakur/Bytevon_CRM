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

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeName: z.string().max(120).optional(),
})

import {type EntityOption } from '@/shared/components/forms/EntitySearch'

export const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assignee: z.custom<EntityOption | null>().optional(),
})