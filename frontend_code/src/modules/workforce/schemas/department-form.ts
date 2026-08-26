import { z } from 'zod'

/** UI form — string ids for Select; map to CreateDepartmentInput on submit. */
export const departmentFormSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  description: z.string().optional().or(z.literal('')),
  headEmploymentId: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']),
  colorTag: z.string().optional().or(z.literal('')),
  parentHint: z.string().optional().or(z.literal('')),
})

export type DepartmentFormInput = z.infer<typeof departmentFormSchema>

export const emptyDepartmentForm = (): DepartmentFormInput => ({
  name: '',
  description: '',
  headEmploymentId: '',
  status: 'Active',
  colorTag: '#0058bc',
  parentHint: '',
})
