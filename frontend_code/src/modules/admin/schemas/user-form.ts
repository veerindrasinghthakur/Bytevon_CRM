import { z } from 'zod'

/** UI form state for create-user login (string ids for Select). */
export const userFormSchema = z.object({
  employmentId: z.string().min(1, 'Select an employee'),
  email: z.string().email('Enter a valid email'),
  temporaryPassword: z.string().min(6, 'At least 6 characters'),
  roleId: z.string().min(1, 'Select a role'),
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
