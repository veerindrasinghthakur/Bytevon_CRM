import { z } from 'zod'

export const adminRoleStatusSchema = z.enum(['Active', 'Archived'])
export const adminRoleCategorySchema = z.enum([
  'Core Role',
  'Operational',
  'Financial',
  'Standard',
])

export const adminRoleSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(80),
  description: z.string().max(500),
  usersCount: z.number().int().nonnegative(),
  permissions: z.array(z.string()),
  status: adminRoleStatusSchema,
  category: adminRoleCategorySchema,
  coveragePct: z.number().min(0).max(100),
  coverageLabel: z.string(),
  created: z.string(),
  updated: z.string(),
})

export type AdminRoleSchema = z.infer<typeof adminRoleSchema>

export const roleFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(80),
  description: z.string().max(500).optional().or(z.literal('')),
  category: adminRoleCategorySchema.optional(),
  status: adminRoleStatusSchema.optional(),
})

export type RoleFormInput = z.infer<typeof roleFormSchema>

export const rolePermissionActionSchema = z.enum([
  'VIEW',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'EXPORT',
  'UNLOCK',
])
