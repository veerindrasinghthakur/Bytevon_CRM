import { z } from 'zod'

/** Display labels; map to schema CASUAL|SICK|EARNED|LOSS_OF_PAY|COMP_OFF at API boundary */
export const leaveTypeSchema = z.enum(['Casual', 'Sick', 'Earned', 'Unpaid', 'Comp Off'])
export type LeaveType = z.infer<typeof leaveTypeSchema>

export const leaveStatusSchema = z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled'])
export type LeaveStatus = z.infer<typeof leaveStatusSchema>

export const leaveBalanceSchema = z.object({
  type: leaveTypeSchema,
  used: z.number(),
  total: z.number(),
  remaining: z.number(),
})
export type LeaveBalance = z.infer<typeof leaveBalanceSchema>

export const leaveTypeOptionSchema = z.object({
  id: z.string(),
  name: z.union([leaveTypeSchema, z.string()]),
  code: z.string(),
  annualEntitlement: z.number(),
  description: z.string().optional(),
})
export type LeaveTypeOption = z.infer<typeof leaveTypeOptionSchema>

export const leaveRequestSchema = z.object({
  id: z.string(),
  type: leaveTypeSchema,
  from: z.string(),
  to: z.string(),
  days: z.number(),
  reason: z.string(),
  status: leaveStatusSchema,
  appliedOn: z.string(),
  approver: z.string().optional(),
  halfDay: z.enum(['start', 'end', 'both']).nullable().optional(),
})
export type LeaveRequest = z.infer<typeof leaveRequestSchema>

export const createLeaveRequestSchema = z.object({
  type: leaveTypeSchema,
  from: z.string().min(1),
  to: z.string().min(1),
  reason: z.string().min(10).max(500),
  halfDay: z.boolean().optional(),
})
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>

/** Holiday row returned by apply-context / organization calendars */
export const holidayItemSchema = z.object({
  date: z.string(),
  name: z.string(),
  holidayType: z.string().optional(),
})
export type HolidayItem = z.infer<typeof holidayItemSchema>

/**
 * Single bootstrap payload for Apply Leave.
 * Backend (or mock) owns holidays, types, balances — client does not hardcode calendars.
 */
export const applyLeaveContextSchema = z.object({
  holidays: z.array(holidayItemSchema),
  leaveTypes: z.array(leaveTypeOptionSchema),
  balances: z.array(leaveBalanceSchema),
})
export type ApplyLeaveContext = z.infer<typeof applyLeaveContextSchema>

export const leaveCalculateInputSchema = z.object({
  type: leaveTypeSchema,
  from: z.string().min(1),
  to: z.string().min(1),
  halfDay: z.boolean().optional(),
})
export type LeaveCalculateInput = z.infer<typeof leaveCalculateInputSchema>

export const leaveCalculateResultSchema = z.object({
  dayCost: z.number(),
  balanceRemaining: z.number().nullable().optional(),
  estimatedBalanceAfter: z.number().nullable().optional(),
  holidaysInRange: z.array(holidayItemSchema).optional(),
})
export type LeaveCalculateResult = z.infer<typeof leaveCalculateResultSchema>
