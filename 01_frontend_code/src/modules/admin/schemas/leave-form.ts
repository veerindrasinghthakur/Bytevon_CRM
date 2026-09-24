import { z } from 'zod'

export const leaveTypeFormSchema = z.object({
  name: z.string().min(1, 'Leave type name is required'),
  days: z.coerce.number().min(0),
  eligibility: z.string().min(1, 'Eligibility is required'),
})

export type LeaveTypeForm = z.infer<typeof leaveTypeFormSchema>

/** UI form state for leave policy create/edit — leave_type is a master-table code. */
export const leavePolicyFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  leave_type: z.string().min(1, 'Leave type is required'),
  annual_entitlement: z.coerce.number().min(0),
  carry_forward_limit: z.coerce.number().min(0),
  effective_from: z.string().min(1, 'Effective from is required'),
  effective_to: z.string().optional().or(z.literal('')),
})

export type LeavePolicyFormInput = z.infer<typeof leavePolicyFormSchema>

/** Leave type master create/edit — maps to POST/PATCH /leave/types. */
export const leaveTypeMasterFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, _ and - only'),
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
  is_paid: z.boolean(),
  requires_approval: z.boolean(),
  requires_document: z.boolean(),
  allow_half_day: z.boolean(),
  allow_hourly: z.boolean(),
  is_encashable: z.boolean(),
  default_annual_entitlement: z.coerce.number().min(0),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int(),
})

export type LeaveTypeMasterFormInput = z.infer<typeof leaveTypeMasterFormSchema>

export function emptyLeaveTypeMasterForm(): LeaveTypeMasterFormInput {
  return {
    code: '',
    name: '',
    description: '',
    is_paid: true,
    requires_approval: true,
    requires_document: false,
    allow_half_day: true,
    allow_hourly: false,
    is_encashable: false,
    default_annual_entitlement: 0,
    is_active: true,
    sort_order: 0,
  }
}
