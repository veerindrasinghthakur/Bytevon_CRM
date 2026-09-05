import { z } from 'zod'
import { teamMemberFormSchema, teamMemberRoleSchema } from './team-member-form'
import type { TeamMemberFormValues, TeamMemberRole } from '../types'

/** UI form state for create/edit team (string projectId for Select). */
export const teamFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
  headName: z.string().optional().or(z.literal('')),
  headRole: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  projectId: z.string().optional().or(z.literal('')),
})

export type TeamFormInput = z.infer<typeof teamFormSchema>

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(2000).optional(),
  headName: z.string().max(120).optional(),
  headRole: z.string().max(80).optional(),
})

export const roleSchema = teamMemberRoleSchema
export const formSchema = teamMemberFormSchema

export type TeamMemberRoleFormValue = TeamMemberRole
export type TeamMemberForm = TeamMemberFormValues

import { type EntityOption } from '@/shared/components/forms/EntitySearch'

export const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(500).optional(),
  head: z.custom<EntityOption | null>().optional(),
  members: z.array(z.custom<EntityOption>()).optional(),
})

export type FormValues = z.infer<typeof schema>