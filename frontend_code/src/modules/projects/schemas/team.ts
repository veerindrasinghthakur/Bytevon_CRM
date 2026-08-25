import { z } from 'zod'

export const teamStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  department: z.string().optional(),
  headName: z.string().optional(),
  headRole: z.string().optional(),
  projectName: z.string().optional(),
  memberCount: z.number(),
  projectCount: z.number(),
  status: teamStatusSchema,
  createdAt: z.string(),
})

export type TeamSchema = z.infer<typeof teamSchema>

export const teamListResponseSchema = z.object({
  items: z.array(teamSchema),
  total: z.number(),
})

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  description: z.string().max(2000).optional().or(z.literal('')),
  headName: z.string().max(120).optional().or(z.literal('')),
  headRole: z.string().max(80).optional().or(z.literal('')),
  memberNames: z.array(z.string()).optional(),
  projectId: z.number().optional(),
  projectName: z.string().optional(),
})

export type CreateTeamSchemaInput = z.infer<typeof createTeamSchema>

export const teamFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
  headName: z.string().optional().or(z.literal('')),
  headRole: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  projectId: z.string().optional().or(z.literal('')),
})

export type TeamFormInput = z.infer<typeof teamFormSchema>
