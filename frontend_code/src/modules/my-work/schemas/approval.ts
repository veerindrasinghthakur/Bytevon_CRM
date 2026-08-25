import { z } from 'zod'

export const approvalStatusSchema = z.enum(['Pending', 'Approved', 'Rejected'])
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>

export const approvalTypeSchema = z.enum(['Leave', 'Attendance Correction', 'Expense', 'Other'])
export type ApprovalType = z.infer<typeof approvalTypeSchema>

export const approvalRequestSchema = z.object({
  id: z.string(),
  type: approvalTypeSchema,
  title: z.string(),
  submittedOn: z.string(),
  status: approvalStatusSchema,
  summary: z.string().optional(),
})
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>

export const approvalListResponseSchema = z.object({
  items: z.array(approvalRequestSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type ApprovalListResponse = z.infer<typeof approvalListResponseSchema>

export const approverOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  department: z.string().optional(),
})
export type ApproverOption = z.infer<typeof approverOptionSchema>
