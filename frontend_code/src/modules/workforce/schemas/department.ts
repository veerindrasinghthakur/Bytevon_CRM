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

export const departmentListResponseSchema = z.object({
  items: z.array(departmentListItemSchema),
  total: z.number(),
})

export const departmentEmployeeSchema = z.object({
  employmentId: z.number(),
  employeeCode: z.string(),
  name: z.string(),
  positionName: z.string(),
  state: z.string(),
  email: z.string(),
})

export type DepartmentEmployeeSchema = z.infer<typeof departmentEmployeeSchema>

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  headEmploymentId: z.number().nullable().optional(),
  isArchived: z.boolean().optional(),
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
