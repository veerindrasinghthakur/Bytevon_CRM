import { z } from 'zod'

export const leaveTypeSettingSchema = z.object({
  name: z.string(),
  desc: z.string(),
  days: z.string(),
  eligibility: z.string(),
  eligibilityStyle: z.string(),
})

export const leavePolicySchema = z.object({
  id: z.number(),
  name: z.string(),
  leave_type: z.string(),
  annual_entitlement: z.number(),
  carry_forward_limit: z.number(),
  effective_from: z.string(),
  effective_to: z.string().nullable(),
})

export const leaveLedgerSchema = z.object({
  id: z.number(),
  leave_type: z.string(),
  transaction_type: z.string(),
  days: z.number(),
  reference_type: z.string(),
  created_at: z.string(),
})

export const leaveAccrualPolicySchema = z.object({
  maxCarryOverDays: z.number().int().min(0).max(365),
  minimumNoticeDays: z.number().int().min(0).max(90),
})

export type LeaveAccrualPolicyInput = z.infer<typeof leaveAccrualPolicySchema>

/** Re-export form schema from dedicated file */
export { leavePolicyFormSchema, type LeavePolicyFormInput } from './leave-form'
