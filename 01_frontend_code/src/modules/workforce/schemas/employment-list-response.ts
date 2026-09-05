import { z } from 'zod'
import { employmentListItemSchema } from './employment'

export const employmentListResponseSchema = z.object({
  items: z.array(employmentListItemSchema),
  total: z.number(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  metrics: z
    .object({
      total: z.number(),
      active: z.number(),
      archived: z.number(),
    })
    .optional(),
})

export type EmploymentListResponse = z.infer<typeof employmentListResponseSchema>
