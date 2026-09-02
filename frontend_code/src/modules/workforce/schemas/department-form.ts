import { z } from 'zod'
import { departmentStatusSchema, type CreateDepartmentInput } from './department'

/** UI form — string ids for Select; map via toCreateDepartmentInput on submit. */
export const departmentFormSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  description: z.string().optional().or(z.literal('')),
  headEmploymentId: z.string().optional().or(z.literal('')),
  status: departmentStatusSchema,
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

/** Form → API create payload (string Select id → number | null). */
export function toCreateDepartmentInput(form: DepartmentFormInput): CreateDepartmentInput {
  const head = form.headEmploymentId?.trim?.() ?? ''
  return {
    name: form.name.trim(),
    headEmploymentId: head ? Number(head) : null,
    isArchived: form.status === 'Inactive',
  }
}
