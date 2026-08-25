import { z } from 'zod'

/** UI form state for create-user login (string ids for Select). */
export const userFormSchema = z.object({
  employmentId: z.string().min(1, 'Select an employee'),
  email: z.string().email('Enter a valid email'),
  temporaryPassword: z.string().min(6, 'At least 6 characters'),
  roleId: z.string().min(1, 'Select a role'),
})

export type UserFormInput = z.infer<typeof userFormSchema>
