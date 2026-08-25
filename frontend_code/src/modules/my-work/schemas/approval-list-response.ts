import { z } from 'zod'
import { approvalRequestSchema } from './approval'

export const approvalListResponseSchema = z.object({
  items: z.array(approvalRequestSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type ApprovalListResponse = z.infer<typeof approvalListResponseSchema>