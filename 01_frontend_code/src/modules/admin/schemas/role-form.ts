import { z } from 'zod'
import { adminRoleCategorySchema, adminRoleStatusSchema } from './roles'

import { hierarchyLevels, inheritOptions } from './enums'

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
