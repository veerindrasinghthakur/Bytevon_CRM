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
  startDate: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  estimatedHours: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: 'Estimated hours must be 0 or more',
    }),
})

import {type EntityOption } from '@/shared/components/forms/EntitySearch'

/**
 * Single create-task schema (TaskCreatePage): project picker + assignee +
 * optional dates. Backend field map: project_id, assignee_employment_id,
 * start_date, due_date (snake_case, applied in api/task createTask).
 */
export const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  projectId: z.number().int().positive().nullable().optional(),
  assignee: z.custom<EntityOption | null>().optional(),
  startDate: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  estimatedHours: z
    .union([z.string(), z.number(), z.nan()])
    .optional()
    .transform((v) =>
      v === '' || v == null || (typeof v === 'number' && Number.isNaN(v)) ? undefined : Number(v),
    )
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: 'Estimated hours must be 0 or more',
    }),
})
