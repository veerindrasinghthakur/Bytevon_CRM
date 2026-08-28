import { z } from 'zod'
import { adminRoleCategorySchema, adminRoleStatusSchema } from './roles'

const hierarchyLevels = [
  '1 (Entry)',
  '2',
  '3',
  '4',
  '5 (Management)',
  '10 (Executive)',
] as const

const inheritOptions = [
  'None (Custom)',
  'Basic Employee',
  'Financial Analyst',
  'HR Manager',
] as const

/** UI form state for create/edit role. */
export const roleFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(80),
  description: z.string().max(500).optional().or(z.literal('')),
  category: adminRoleCategorySchema.optional(),
  status: adminRoleStatusSchema.optional(),
  hierarchy: z.enum(hierarchyLevels).optional(),
  inherit: z.enum(inheritOptions).optional(),
  active: z.boolean(),
})

export type RoleFormInput = z.infer<typeof roleFormSchema>
