import { z } from 'zod'
import { attendanceCorrectionSchema } from './attendance'

export const correctionListResponseSchema = z.object({
  items: z.array(attendanceCorrectionSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type CorrectionListResponse = z.infer<typeof correctionListResponseSchema>