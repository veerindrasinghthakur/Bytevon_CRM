import { z } from 'zod'
import { ProjectStatus as ProjectStatusEnum } from '../../enums'

export const projectStatusSchema = z.enum(ProjectStatusEnum)

export type ProjectStatus = z.infer<typeof projectStatusSchema>

export const projectListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().optional().nullable(),
  status: projectStatusSchema,
  clientName: z.string().optional().nullable(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional().nullable(),
  teamCount: z.number().optional().nullable(),
  taskCount: z.number().optional().nullable(),
  openTasks: z.number().optional().nullable(),
  daysToDeadline: z.number().nullable().optional(),
  teamMemberCount: z.number().optional().nullable(),
  teamName: z.string().nullable().optional(),
  teamHeadName: z.string().nullable().optional(),
  /** Primary assigned team */
  teamId: z.number().nullable().optional(),
})

export type ProjectListItem = z.infer<typeof projectListItemSchema>

export const projectDetailSchema = projectListItemSchema.extend({
  description: z.string().optional().nullable(),
  repositoryUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
})

export type ProjectDetail = z.infer<typeof projectDetailSchema>

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  code: z.string().max(32).optional(),
  description: z.string().max(2000).optional(),
  clientName: z.string().max(120).optional(),
  clientId: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  repositoryUrl: z.string().max(500).optional().or(z.literal('')),
  teamId: z.number().nullable().optional(),
  assignedEmploymentId: z.number().int().positive().optional().nullable(),
  assignmentType: z.enum(['TEAM', 'INDIVIDUAL']).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const projectListResponseSchema = z.object({
  items: z.array(projectListItemSchema),
  total: z.number(),
})

export { projectFormSchema, type ProjectFormInput } from './project-form'

