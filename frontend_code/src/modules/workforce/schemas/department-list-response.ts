import { z } from 'zod'
import { departmentListItemSchema } from './department'

export const departmentListResponseSchema = z.object({
  items: z.array(departmentListItemSchema),
  total: z.number(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  metrics: z
    .object({
      total: z.number(),
      active: z.number(),
      inactive: z.number(),
      staffing: z.number(),
    })
    .optional(),
})

export type DepartmentListResponse = z.infer<typeof departmentListResponseSchema>
