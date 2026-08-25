import { z } from 'zod'

export const adminUserStatusSchema = z.enum(['Active', 'Inactive', 'Locked'])

export const adminUserListItemSchema = z.object({
  id: z.number(),
  employmentId: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  department: z.string(),
  status: adminUserStatusSchema,
  lastLogin: z.string(),
  lastLoginAt: z.string().nullable(),
  initials: z.string(),
  employeeCode: z.string(),
})

export type AdminUserListItemSchema = z.infer<typeof adminUserListItemSchema>

export const adminUsersListResponseSchema = z.object({
  items: z.array(adminUserListItemSchema),
  total: z.number(),
  locked: z.number().optional(),
  active: z.number().optional(),
})

export const createUserLoginSchema = z.object({
  employmentId: z.number().positive(),
  email: z.string().email('Enter a valid email'),
  temporaryPassword: z.string().min(6, 'At least 6 characters'),
  roleId: z.union([z.number(), z.string().min(1)]),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
})

export type CreateUserLoginInput = z.infer<typeof createUserLoginSchema>

/** Re-export form schema from dedicated file */
export { userFormSchema, type UserFormInput } from './user-form'
