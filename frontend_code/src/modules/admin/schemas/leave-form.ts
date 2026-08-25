import { z } from 'zod'

/** UI form state for leave policy create/edit. */
export const leavePolicyFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  leave_type: z.string().min(1, 'Leave type is required'),
  annual_entitlement: z.coerce.number().min(0),
  carry_forward_limit: z.coerce.number().min(0),
  effective_from: z.string().min(1, 'Effective from is required'),
  effective_to: z.string().optional().or(z.literal('')),
})

export type LeavePolicyFormInput = z.infer<typeof leavePolicyFormSchema>
