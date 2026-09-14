import { z } from 'zod'

export const departmentStatusSchema = z.enum(['Active', 'Inactive'])

export const departmentListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  headName: z.string(),
  headEmploymentId: z.number().nullable(),
  staffCount: z.number(),
  isArchived: z.boolean(),
  status: departmentStatusSchema,
  createdAt: z.string(),
})

export type DepartmentListItemSchema = z.infer<typeof departmentListItemSchema>
/** Alias used by API / pages */
export type DepartmentListItem = DepartmentListItemSchema

export const departmentEmployeeSchema = z.object({
  employmentId: z.number(),
  employeeCode: z.string(),
  name: z.string(),
  positionName: z.string(),
  state: z.string(),
  email: z.string(),
  departmentId: z.number().optional(),
})

export type DepartmentEmployeeSchema = z.infer<typeof departmentEmployeeSchema>
export type DepartmentEmployee = DepartmentEmployeeSchema

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  headEmploymentId: z.number().nullable().optional(),
  isArchived: z.boolean().optional(),
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>

// Form helpers only — do NOT re-export department-list-response here (circular TDZ).
export {
  departmentFormSchema,
  type DepartmentFormInput,
  emptyDepartmentForm,
  toCreateDepartmentInput,
} from './department-form'
