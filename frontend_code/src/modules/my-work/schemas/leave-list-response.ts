import { z } from 'zod'
import { leaveRequestSchema } from './leave'

export const leaveListResponseSchema = z.object({
  items: z.array(leaveRequestSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type LeaveListResponse = z.infer<typeof leaveListResponseSchema>