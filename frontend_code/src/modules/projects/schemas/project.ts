import { z } from 'zod'

export const projectStatusSchema = z.enum([
  'PLANNING',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
])

export type ProjectStatus = z.infer<typeof projectStatusSchema>

export const projectListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().optional(),
  status: projectStatusSchema,
  clientName: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  teamCount: z.number().optional(),
  taskCount: z.number().optional(),
})

export type ProjectListItem = z.infer<typeof projectListItemSchema>

export const projectDetailSchema = projectListItemSchema.extend({
  description: z.string().optional(),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type ProjectDetail = z.infer<typeof projectDetailSchema>

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  code: z.string().max(32).optional(),
  description: z.string().max(2000).optional(),
  clientName: z.string().max(120).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  repositoryUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const projectListResponseSchema = z.object({
  items: z.array(projectListItemSchema),
  total: z.number(),
})