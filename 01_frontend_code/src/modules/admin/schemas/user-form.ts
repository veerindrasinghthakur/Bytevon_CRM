import { z } from 'zod'

/** UI form state for create-user login (string ids for Select).
 * Matches backend AdminUserCreate: employmentId, email, temporaryPassword (min 8), roleId?
 */
export const userFormSchema = z.object({
  employmentId: z.string().min(1, 'Select an employee'),
  email: z.string().email('Enter a valid email'),
  temporaryPassword: z.string().min(8, 'At least 8 characters (backend requirement)'),
  roleId: z.string().min(1, 'Select a role'),
  deptFilter: z.string().optional(),
  sendInvite: z.boolean().optional(),
})

export type UserFormInput = z.infer<typeof userFormSchema>

/** Edit-user form (UserDetailPage) — string ids for SearchableSelect. */
export const userEditFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  email: z.string().email('Enter a valid email'),
  departmentId: z.string(),
  roleId: z.string(),
})

export type UserEditFormValues = z.infer<typeof userEditFormSchema>
