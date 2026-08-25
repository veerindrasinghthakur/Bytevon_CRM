import { z } from 'zod'
import { attendanceRecordSchema } from './attendance'

export const attendanceListResponseSchema = z.object({
  items: z.array(attendanceRecordSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type AttendanceListResponse = z.infer<typeof attendanceListResponseSchema>