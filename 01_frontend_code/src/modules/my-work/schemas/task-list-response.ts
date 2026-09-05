import { z } from 'zod'
import { myTaskSchema } from './task'

export const myTaskListResponseSchema = z.object({
  items: z.array(myTaskSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type MyTaskListResponse = z.infer<typeof myTaskListResponseSchema>